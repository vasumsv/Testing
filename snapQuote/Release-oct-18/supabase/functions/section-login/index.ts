import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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

    const body = await req.json();
    const { action, section } = body;

    if (action === "login") {
      const { username, password, studio_id } = body;
      if (!username || !password || !studio_id || !section) {
        return jsonError("Username, password, studio ID, and section are required", 400);
      }

      if (section !== "dashboard" && section !== "payments" && section !== "analytics") {
        return jsonError("Invalid section", 400);
      }

      const enabledCol = section + "_access_enabled";
      const userCol = section + "_username";
      const hashCol = section + "_password_hash";

      const { data: studio, error } = await supabase
        .from("studios")
        .select(`id, ${userCol}, ${hashCol}, ${enabledCol}`)
        .eq("id", studio_id)
        .maybeSingle();

      if (error || !studio) {
        return jsonError("Invalid credentials", 401);
      }

      if (!studio[enabledCol]) {
        return jsonError(`${section} access is not enabled for this studio`, 403);
      }

      if (studio[userCol] !== username) {
        return jsonError("Invalid credentials", 401);
      }

      const { data: valid, error: verifyError } = await supabase.rpc("verify_admin_password", {
        p_password: password,
        p_hash: studio[hashCol],
      });

      if (verifyError || !valid) {
        return jsonError("Invalid credentials", 401);
      }

      const token = crypto.randomUUID() + "-" + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

      const { error: sessionError } = await supabase.from("section_sessions").insert({
        studio_id: studio.id,
        section,
        token,
        expires_at: expiresAt,
      });

      if (sessionError) {
        return jsonError("Failed to create session", 500);
      }

      return new Response(JSON.stringify({ token, expires_at: expiresAt, section }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "logout") {
      const { token } = body;
      if (token) {
        await supabase.from("section_sessions").delete().eq("token", token);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return jsonError("Unknown action", 400);
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
