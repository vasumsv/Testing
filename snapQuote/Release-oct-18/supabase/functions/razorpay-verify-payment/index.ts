import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("studio_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.studio_id) {
      return new Response(JSON.stringify({ error: "Studio not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      billing_cycle,
      amount_paise,
    } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan: string;
      billing_cycle: string;
      amount_paise: number;
    };

    // Server-side plan + amount validation before activating
    const VALID_PLANS = ["business"];
    const LEGACY_PLANS = ["starter", "growth", "pro"];

    if (LEGACY_PLANS.includes(plan)) {
      return new Response(JSON.stringify({ error: "This plan is no longer available for purchase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!VALID_PLANS.includes(plan)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const EXPECTED_PRICES: Record<string, Record<string, number>> = {
      business: { monthly: 69900, annual: 699000 }, // paise
    };

    const expectedAmount = EXPECTED_PRICES[plan]?.[billing_cycle];
    if (expectedAmount === undefined) {
      return new Response(JSON.stringify({ error: "Invalid billing cycle for plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (Number(amount_paise) !== expectedAmount) {
      return new Response(JSON.stringify({ error: "Amount does not match expected price" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Razorpay credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await supabase
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("studio_id", profile.studio_id);

      return new Response(JSON.stringify({ error: "Payment signature verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Expiry: 30 days for monthly, 365 days for annual
    const expiryDays = billing_cycle === "annual" ? 365 : 30;
    const expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();

    const { data: result, error: rpcError } = await supabase.rpc("upgrade_studio_plan", {
      p_studio_id: profile.studio_id,
      p_payment_id: razorpay_payment_id,
      p_order_id: razorpay_order_id,
      p_plan: "business",
      p_billing_cycle: billing_cycle,
      p_amount_paise: amount_paise,
      p_expires_at: expiresAt,
    });

    if (rpcError) {
      return new Response(JSON.stringify({ error: "Failed to upgrade plan", detail: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
