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
    const body = await req.json();
    const { token, action, subscription_id, payload } = body;

    if (!token || !action || !payload) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session, error: sessionError } = await supabaseService
      .from("admin_sessions")
      .select("id, admin_user_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upsert") {
      const { studio_id, plan, billing_cycle, status, amount, notes, current_period_start, current_period_end } = payload;

      // Admin can only set 'trial' (Free) or 'business' as new active plans.
      // Legacy plans (starter/growth/pro) are rejected for new subscriptions.
      const ALLOWED_PLANS = ["trial", "business"];
      const LEGACY_PLANS = ["starter", "growth", "pro"];

      if (LEGACY_PLANS.includes(plan)) {
        return new Response(JSON.stringify({ error: "Legacy plans (starter/growth/pro) cannot be assigned. Use 'trial' (Free) or 'business' (SnapQuote Business)." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!ALLOWED_PLANS.includes(plan)) {
        return new Response(JSON.stringify({ error: "Invalid plan. Use 'trial' (Free) or 'business' (SnapQuote Business)." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For business plan, billing_cycle and expiry are required
      if (plan === "business" && !billing_cycle) {
        return new Response(JSON.stringify({ error: "billing_cycle is required for business plan" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (subscription_id) {
        await supabaseService.from("subscriptions").update({
          plan, billing_cycle, status, amount, notes,
          current_period_start, current_period_end,
          updated_at: new Date().toISOString(),
        }).eq("id", subscription_id);
      } else {
        await supabaseService.from("subscriptions").insert({
          studio_id, plan, billing_cycle, status, amount, notes,
          current_period_start, current_period_end,
          updated_at: new Date().toISOString(),
        });
      }

      const studioStatus = (status === "active" || status === "trialing") ? "active" : "suspended";
      await supabaseService.from("studios").update({
        plan,
        status: studioStatus,
        subscription_expires_at: current_period_end,
        is_active: status === "active" || status === "trialing",
        updated_at: new Date().toISOString(),
      }).eq("id", studio_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
