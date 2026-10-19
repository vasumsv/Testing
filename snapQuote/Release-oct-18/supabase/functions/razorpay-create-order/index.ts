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
    const { plan, billing_cycle, amount_paise } = body as {
      plan: string;
      billing_cycle: string;
      amount_paise: number;
    };

    if (!plan || !billing_cycle || !amount_paise) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side plan validation — only 'business' is purchasable
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

    // Server-side amount validation — verify amount matches expected price
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
      return new Response(JSON.stringify({ error: "Amount does not match expected price for plan/billing cycle" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Razorpay credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount: amount_paise,
        currency: "INR",
        receipt: `sq_${profile.studio_id.slice(0, 8)}_${Date.now()}`,
        notes: {
          studio_id: profile.studio_id,
          plan,
          billing_cycle,
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      return new Response(JSON.stringify({ error: "Failed to create order", detail: err }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = await orderRes.json();

    await supabase.from("payments").insert({
      studio_id: profile.studio_id,
      razorpay_order_id: order.id,
      plan,
      billing_cycle,
      amount: amount_paise,
      currency: "INR",
      status: "created",
    });

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: razorpayKeyId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
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
