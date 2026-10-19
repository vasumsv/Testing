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
    const { token } = await req.json();
    if (!token) {
      return jsonError("Token required", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session, error: sessionError } = await supabase
      .from("client_payment_sessions")
      .select("id, studio_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sessionError || !session) {
      return jsonError("Invalid or expired session", 401);
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("client_payment_sessions").delete().eq("token", token);
      return jsonError("Session expired", 401);
    }

    const { data: studio, error: studioError } = await supabase
      .from("studios")
      .select("id, name, email, phone, address, logo_url, owner_name, website, payment_access_enabled")
      .eq("id", session.studio_id)
      .maybeSingle();

    if (studioError || !studio || !studio.payment_access_enabled) {
      return jsonError("Studio not found or access disabled", 403);
    }

    // Fetch ALL invoices for this studio
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, invoice_number, client_name, client_email, client_phone, issue_date, due_date, subtotal, gst_rate, gst_amount, total, notes, status, items, created_at")
      .eq("studio_id", session.studio_id)
      .order("created_at", { ascending: false });

    if (invoicesError) {
      return jsonError("Failed to load invoices", 500);
    }

    // Fetch ALL payments for this studio's invoices
    const invoiceIds = (invoices ?? []).map(inv => inv.id);
    let payments: Array<Record<string, unknown>> = [];
    if (invoiceIds.length > 0) {
      const { data: payData, error: payError } = await supabase
        .from("invoice_payments")
        .select("id, invoice_id, amount, payment_method, payment_date, note, created_at")
        .in("invoice_id", invoiceIds)
        .order("payment_date", { ascending: false });
      if (payError) {
        return jsonError("Failed to load payments", 500);
      }
      payments = payData ?? [];
    }

    return new Response(JSON.stringify({ studio, invoices: invoices ?? [], payments }), {
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
