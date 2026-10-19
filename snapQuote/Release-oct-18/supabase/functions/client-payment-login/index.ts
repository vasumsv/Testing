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
    const { action } = body;

    if (action === "login") {
      const { contact_number, studio_id } = body;
      if (!contact_number || !studio_id) {
        return jsonError("Contact number and studio ID are required", 400);
      }

      const { data: studio, error } = await supabase
        .from("studios")
        .select("id, payment_contact_number, payment_password_hash, payment_access_enabled")
        .eq("id", studio_id)
        .maybeSingle();

      if (error || !studio) {
        return jsonError("Invalid credentials", 401);
      }

      if (!studio.payment_access_enabled) {
        return jsonError("Payment access is not enabled for this studio", 403);
      }

      if (studio.payment_contact_number !== contact_number) {
        return jsonError("Invalid credentials", 401);
      }

      const { data: valid, error: verifyError } = await supabase.rpc("verify_admin_password", {
        p_password: body.password,
        p_hash: studio.payment_password_hash,
      });

      if (verifyError || !valid) {
        return jsonError("Invalid credentials", 401);
      }

      const token = crypto.randomUUID() + "-" + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: sessionError } = await supabase.from("client_payment_sessions").insert({
        studio_id: studio.id,
        token,
        expires_at: expiresAt,
      });

      if (sessionError) {
        return jsonError("Failed to create session", 500);
      }

      return new Response(JSON.stringify({ token, expires_at: expiresAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "logout") {
      const { token } = body;
      if (token) {
        await supabase.from("client_payment_sessions").delete().eq("token", token);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return jsonError("Unknown action", 400);
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
