import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "studio-assets";
const RETENTION_DAYS = 30;
// Max files to delete per run to stay within Supabase's batch delete limit
const BATCH_SIZE = 100;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    console.log(`[pdf-cleanup] Starting. Cutoff: ${cutoff.toISOString()} (files older than ${RETENTION_DAYS} days)`);

    let totalDeleted = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // List all objects under all studio sub-paths that match the quotes/ prefix
      // Storage list is per-prefix so we need to walk studio folders.
      // We query storage.objects directly via the service role for efficiency.
      const { data: objects, error: listErr } = await supabase
        .from("storage_objects_view")
        .select("name, created_at")
        .eq("bucket_id", BUCKET)
        .like("name", "%/quotes/%")
        .like("name", "%.pdf")
        .lt("created_at", cutoff.toISOString())
        .order("created_at", { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1);

      // Fallback: use the raw storage.objects table if the view isn't available
      if (listErr) {
        console.log(`[pdf-cleanup] storage_objects_view not available, using storage.objects RPC`);
        break;
      }

      if (!objects || objects.length === 0) {
        hasMore = false;
        break;
      }

      const paths = objects.map((o: { name: string }) => o.name);
      console.log(`[pdf-cleanup] Deleting batch of ${paths.length} files:`, paths);

      const { error: deleteErr } = await supabase.storage
        .from(BUCKET)
        .remove(paths);

      if (deleteErr) {
        console.error(`[pdf-cleanup] Delete error:`, deleteErr.message);
      } else {
        totalDeleted += paths.length;
        console.log(`[pdf-cleanup] Deleted ${paths.length} files. Total so far: ${totalDeleted}`);
      }

      if (objects.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }
    }

    // Direct query against storage.objects using RPC (service role has access)
    if (totalDeleted === 0) {
      const { data: rawObjects, error: rawErr } = await supabase.rpc("cleanup_old_pdfs", {
        p_bucket: BUCKET,
        p_cutoff: cutoff.toISOString(),
        p_batch: BATCH_SIZE,
      });

      if (!rawErr && rawObjects) {
        console.log(`[pdf-cleanup] RPC cleanup result:`, rawObjects);
        totalDeleted = rawObjects?.deleted_count ?? 0;
      } else if (rawErr) {
        // RPC not available — use direct storage list API as final fallback
        console.log(`[pdf-cleanup] RPC not available, using storage list API`);
        totalDeleted = await deleteViaStorageApi(supabase, cutoff);
      }
    }

    console.log(`[pdf-cleanup] Complete. Total deleted: ${totalDeleted}`);

    return new Response(
      JSON.stringify({ success: true, deleted: totalDeleted, cutoff: cutoff.toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[pdf-cleanup] UNHANDLED EXCEPTION:", err?.message ?? String(err));
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Walk all studio folders via the storage list API and delete old PDFs
async function deleteViaStorageApi(
  supabase: ReturnType<typeof createClient>,
  cutoff: Date
): Promise<number> {
  let deleted = 0;

  // List top-level folders (studio IDs)
  const { data: studioFolders, error: studioErr } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 200 });

  if (studioErr || !studioFolders) {
    console.error("[pdf-cleanup] Failed to list studio folders:", studioErr?.message);
    return 0;
  }

  for (const studioFolder of studioFolders) {
    if (!studioFolder.name) continue;
    const studioPrefix = `${studioFolder.name}/quotes`;

    // List year folders
    const { data: yearFolders } = await supabase.storage
      .from(BUCKET)
      .list(studioPrefix, { limit: 50 });

    if (!yearFolders) continue;

    for (const yearFolder of yearFolders) {
      if (!yearFolder.name) continue;
      const yearPrefix = `${studioPrefix}/${yearFolder.name}`;

      // List month folders
      const { data: monthFolders } = await supabase.storage
        .from(BUCKET)
        .list(yearPrefix, { limit: 50 });

      if (!monthFolders) continue;

      for (const monthFolder of monthFolders) {
        if (!monthFolder.name) continue;
        const monthPrefix = `${yearPrefix}/${monthFolder.name}`;

        // List PDFs in this month folder
        const { data: files } = await supabase.storage
          .from(BUCKET)
          .list(monthPrefix, { limit: 500 });

        if (!files) continue;

        const toDelete = files
          .filter(f => {
            if (!f.name.endsWith(".pdf")) return false;
            if (!f.created_at) return false;
            return new Date(f.created_at) < cutoff;
          })
          .map(f => `${monthPrefix}/${f.name}`);

        if (toDelete.length === 0) continue;

        console.log(`[pdf-cleanup] Deleting from ${monthPrefix}:`, toDelete);

        const { error: delErr } = await supabase.storage.from(BUCKET).remove(toDelete);
        if (delErr) {
          console.error(`[pdf-cleanup] Delete error in ${monthPrefix}:`, delErr.message);
        } else {
          deleted += toDelete.length;
          console.log(`[pdf-cleanup] Deleted ${toDelete.length} from ${monthPrefix}`);
        }
      }
    }
  }

  return deleted;
}
