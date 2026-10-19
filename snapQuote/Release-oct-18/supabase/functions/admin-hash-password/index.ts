import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return jsonError("token and password are required", 400);
    }

    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("id, admin_user_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sessionError || !session) {
      return jsonError("Invalid or expired session", 401);
    }

    if (new Date(session.expires_at) < new Date()) {
      return jsonError("Session expired. Please log in again.", 401);
    }

    const { data: hash, error: hashError } = await supabase.rpc("hash_admin_password", {
      p_password: password,
    });

    if (hashError || !hash) {
      return jsonError("Failed to hash password", 500);
    }

    return new Response(JSON.stringify({ hash }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError("Internal server error", 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
