import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/*
  Interakt webhook payload structure for button click:
  {
    "type": "interactiveButtonReply" | "message" | ...,
    "customer": { "phone_number": "919999999999", "name": "..." },
    "data": {
      "message": {
        "type": "interactive",
        "interactive": {
          "type": "button_reply",
          "button_reply": { "id": "interested" | "need_changes" | "not_interested", "title": "..." }
        }
      },
      "callback_data": "{\"quote_id\":\"...\",\"studio_id\":\"...\",\"client_id\":\"...\",...}"
    }
  }
*/

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── Webhook signature verification ────────────────────────────────────────
    const { data: secretRow } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("id", "whatsapp_webhook_secret")
      .maybeSingle();

    const webhookSecret = secretRow?.value as string | undefined;

    let payload: any;

    if (webhookSecret) {
      const rawBody = await req.text();
      const sigHeader = req.headers.get("X-Webhook-Signature") ?? req.headers.get("x-webhook-signature") ?? "";
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
      const computed = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
      if (sigHeader !== computed) {
        console.warn("[interakt-webhook] Signature mismatch — rejecting");
        return new Response(JSON.stringify({ ok: true, error: "invalid signature" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try { payload = JSON.parse(rawBody); } catch { payload = null; }
    } else {
      try { payload = await req.json(); } catch { payload = null; }
    }

    if (!payload) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Interakt sends different event structures — handle both v1 and v2 shapes
    const data = payload.data ?? payload;
    const messageObj = data?.message ?? data?.data?.message;
    const callbackRaw = data?.callback_data ?? data?.data?.callback_data ?? payload.callback_data;

    // Extract button reply ID
    const buttonReplyId: string | undefined =
      messageObj?.interactive?.button_reply?.id ??
      messageObj?.button?.payload ??
      data?.button_reply?.id;

    if (!buttonReplyId || !callbackRaw) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let callbackData: { quote_id?: string; invoice_id?: string; studio_id?: string; client_id?: string; message_type?: string } = {};
    try {
      callbackData = JSON.parse(callbackRaw);
    } catch {
      return new Response(JSON.stringify({ ok: true, error: "invalid callback_data" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quote_id, studio_id, client_id } = callbackData;

    if (!quote_id || !studio_id) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Map button reply to client_response ──────────────────────────────────
    // These map to the clients.client_response column — NOT to quote status.
    // The quote status is only updated for the original quote_sent buttons.
    let clientResponse: string | null = null;
    let quoteStatusUpdate: string | null = null;

    if (buttonReplyId === "interested") {
      clientResponse = "interested";
      quoteStatusUpdate = "interested";
    } else if (buttonReplyId === "need_changes" || buttonReplyId === "discuss") {
      clientResponse = "wants_to_discuss";
      quoteStatusUpdate = "follow_up_pending";
    } else if (buttonReplyId === "not_interested") {
      clientResponse = "not_interested";
      quoteStatusUpdate = "rejected";
    }

    const now = new Date().toISOString();

    // ─── Update client_response with dedup ─────────────────────────────────────
    // Only update if the response is different from what's already stored,
    // or if no response has been recorded yet. This prevents duplicate webhook
    // events from creating duplicate updates.
    if (clientResponse && client_id) {
      const { data: existingClient } = await supabase
        .from("clients")
        .select("client_response, client_response_at")
        .eq("id", client_id)
        .eq("studio_id", studio_id)
        .maybeSingle();

      if (existingClient) {
        // Dedup: skip if the same response was already recorded in the last 5 minutes
        const lastResponseAt = existingClient.client_response_at ? new Date(existingClient.client_response_at).getTime() : 0;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        if (existingClient.client_response !== clientResponse || lastResponseAt < fiveMinutesAgo) {
          await supabase
            .from("clients")
            .update({
              client_response: clientResponse,
              client_response_at: now,
              client_response_quote_id: quote_id,
              updated_at: now,
            })
            .eq("id", client_id)
            .eq("studio_id", studio_id);
          console.log(`[interakt-webhook] Client ${client_id} → client_response=${clientResponse}`);
        } else {
          console.log(`[interakt-webhook] Duplicate response for client ${client_id} — skipping`);
        }
      }
    }

    // ─── Update quote status (existing behavior, preserved) ────────────────────
    if (quoteStatusUpdate) {
      await supabase
        .from("quotes")
        .update({ status: quoteStatusUpdate, updated_at: now })
        .eq("id", quote_id)
        .eq("studio_id", studio_id);
      console.log(`[interakt-webhook] Quote ${quote_id} → status=${quoteStatusUpdate} (button: ${buttonReplyId})`);
    }

    // Log the customer response
    await supabase.from("whatsapp_logs").insert({
      studio_id,
      quote_id,
      invoice_id: null,
      message_type: "custom",
      phone: payload.customer?.phone_number ?? data?.customer?.phone_number ?? "",
      status: "delivered",
      interakt_message_id: null,
      error_message: `Customer replied: ${buttonReplyId}`,
    });

    return new Response(JSON.stringify({ ok: true, client_response: clientResponse, status_updated: quoteStatusUpdate }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[interakt-webhook] Error:", err?.message);
    return new Response(JSON.stringify({ ok: true, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
