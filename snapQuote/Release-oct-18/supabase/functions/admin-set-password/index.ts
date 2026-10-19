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
    const { token, current_password, new_password } = await req.json();

    if (!token || !current_password || !new_password) {
      return new Response(
        JSON.stringify({ error: "token, current_password and new_password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("admin_sessions").delete().eq("token", token);
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, password_hash, is_active")
      .eq("id", session.admin_user_id)
      .maybeSingle();

    if (userError || !adminUser || !adminUser.is_active) {
      return new Response(
        JSON.stringify({ error: "Admin user not found or inactive" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: valid, error: verifyError } = await supabase.rpc("verify_admin_password", {
      p_password: current_password,
      p_hash: adminUser.password_hash,
    });

    if (verifyError || !valid) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: newHash, error: hashError } = await supabase.rpc("hash_admin_password", {
      p_password: new_password,
    });

    if (hashError || !newHash) {
      return new Response(
        JSON.stringify({ error: "Failed to hash new password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updateError } = await supabase
      .from("admin_users")
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
