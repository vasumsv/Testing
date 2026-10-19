import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ACCESS_COL: Record<string, string> = {
  dashboard: "dashboard_access_enabled",
  payments: "payments_access_enabled",
  analytics: "analytics_access_enabled",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { token, section } = await req.json();
    if (!token || !section) {
      return jsonError("Token and section are required", 400);
    }

    if (section !== "dashboard" && section !== "payments" && section !== "analytics") {
      return jsonError("Invalid section", 400);
    }

    const { data: session, error } = await supabase
      .from("section_sessions")
      .select("studio_id, section, expires_at")
      .eq("token", token)
      .eq("section", section)
      .maybeSingle();

    if (error || !session) {
      return jsonError("Invalid session", 401);
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("section_sessions").delete().eq("token", token);
      return jsonError("Session expired", 401);
    }

    // Check that the section is still enabled for this studio
    const accessCol = ACCESS_COL[section];
    const { data: studio } = await supabase
      .from("studios")
      .select(`id, ${accessCol}`)
      .eq("id", session.studio_id)
      .maybeSingle();

    if (!studio || !studio[accessCol]) {
      // Access was disabled after the session was created — invalidate it
      await supabase.from("section_sessions").delete().eq("token", token);
      return jsonError("Access has been disabled for this section", 403);
    }

    return new Response(JSON.stringify({ valid: true, studio_id: session.studio_id, section: session.section }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
