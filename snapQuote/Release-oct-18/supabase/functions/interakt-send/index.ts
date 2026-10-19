import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const INTERAKT_API = "https://api.interakt.ai/v1/public/message/";

type MessageType = "quote_sent" | "follow_up" | "payment_received" | "payment_complete" | "custom";

interface SendRequest {
  studio_id: string;
  quote_id?: string;
  invoice_id?: string;
  client_id?: string;
  message_type: MessageType;
  phone: string;
  template_name?: string;
  language_code?: string;
  pdf_base64?: string;
  pdf_filename?: string;
  pdf_url?: string;
  body_values?: string[];
  button_values?: Record<string, string[]>;
  followup_number?: number;
}

const ALL_TEMPLATE_KEYS = [
  "whatsapp_api_key",
  "whatsapp_active",
  "whatsapp_business_number",
  "whatsapp_quote_template",
  "whatsapp_followup_template_1",
  "whatsapp_followup_template_2",
  "whatsapp_followup_template_3",
  "whatsapp_final_followup_template",
  "whatsapp_payment_received_template",
  "whatsapp_final_payment_template",
];

function resolveTemplateKey(message_type: MessageType, followup_number?: number): string {
  if (message_type === "follow_up") {
    const n = followup_number ?? 1;
    if (n === 2) return "whatsapp_followup_template_2";
    if (n === 3) return "whatsapp_followup_template_3";
    if (n >= 4) return "whatsapp_final_followup_template";
    return "whatsapp_followup_template_1";
  }
  if (message_type === "quote_sent") return "whatsapp_quote_template";
  if (message_type === "payment_received") return "whatsapp_payment_received_template";
  if (message_type === "payment_complete") return "whatsapp_final_payment_template";
  return "";
}

function normalizePhone(raw: string): { countryCode: string; phoneNumber: string } | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7) return null;

  // Strip a leading 91 country code if the remaining part is a valid 10-digit Indian mobile
  if (digits.startsWith("91") && digits.length >= 12 && digits.length <= 13) {
    return { countryCode: "+91", phoneNumber: digits.slice(2) };
  }
  if (digits.startsWith("1") && digits.length === 11) {
    return { countryCode: "+1", phoneNumber: digits.slice(1) };
  }
  if (digits.length === 10) {
    return { countryCode: "+91", phoneNumber: digits };
  }
  if (digits.length > 10) {
    const cc = digits.slice(0, digits.length - 10);
    const num = digits.slice(digits.length - 10);
    return { countryCode: `+${cc}`, phoneNumber: num };
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token || token === anonKey) {
      // Frontend sends anon key — accepted, studio_id verified against DB below
    }

    const body: SendRequest = await req.json();
    const {
      studio_id, quote_id, invoice_id, client_id, message_type, phone,
      language_code = "en",
      pdf_base64, pdf_filename,
      pdf_url: incomingPdfUrl,
      body_values, button_values,
      followup_number,
    } = body;

    console.log(`[interakt-send] REQUEST: type=${message_type} studio=${studio_id} phone=${phone} client=${client_id ?? 'none'} followup=${followup_number ?? 1}`);

    if (!studio_id || !phone) {
      return new Response(JSON.stringify({ error: "Missing required fields: studio_id, phone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Verify studio exists ──────────────────────────────────────────────────
    const { data: studio, error: studioErr } = await supabase
      .from("studios")
      .select("id, name")
      .eq("id", studio_id)
      .maybeSingle();

    if (studioErr || !studio) {
      console.error("[interakt-send] Studio not found:", studio_id, studioErr?.message);
      return new Response(JSON.stringify({ error: "Studio not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Follow-up enforcement: max 3 per client (server-side) ──────────────────
    let currentFollowupCount = 0;
    if (message_type === "follow_up" && client_id) {
      const { data: clientRow } = await supabase
        .from("clients")
        .select("followup_count")
        .eq("id", client_id)
        .eq("studio_id", studio_id)
        .maybeSingle();

      if (!clientRow) {
        return new Response(JSON.stringify({ error: "Client not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      currentFollowupCount = clientRow.followup_count ?? 0;

      if (currentFollowupCount >= 3) {
        console.warn(`[interakt-send] Follow-up limit reached for client ${client_id} (${currentFollowupCount}/3)`);
        return new Response(JSON.stringify({ error: "Maximum 3 follow-ups per client have been sent.", limit_reached: true }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── Fetch centralized WhatsApp config from platform_settings ──────────────
    const { data: settingsRows, error: settingsErr } = await supabase
      .from("platform_settings")
      .select("id, value")
      .in("id", ALL_TEMPLATE_KEYS);

    if (settingsErr) {
      console.error("[interakt-send] DB error fetching platform_settings:", settingsErr.message);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings: Record<string, any> = {};
    for (const row of settingsRows ?? []) {
      settings[row.id] = row.value;
    }

    const apiKey = settings.whatsapp_api_key as string | undefined;
    const isActive = settings.whatsapp_active === true;

    if (!apiKey || !isActive) {
      console.warn("[interakt-send] WhatsApp not configured or inactive");
      return new Response(JSON.stringify({ error: "WhatsApp is not configured. Please contact the SnapQuote administrator.", configured: false }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Determine template name ───────────────────────────────────────────────
    let template_name = body.template_name;
    if (!template_name) {
      const key = resolveTemplateKey(message_type, followup_number);
      if (key) {
        template_name = settings[key] as string | undefined;
      }
    }

    if (!template_name) {
      console.warn(`[interakt-send] No template configured for message_type=${message_type} followup=${followup_number ?? 1}`);
      return new Response(JSON.stringify({ error: "WhatsApp is not configured. Please contact the SnapQuote administrator.", configured: false }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── For follow_up: fetch PDF URL from the quote if not provided ───────────
    let pdfPublicUrl: string | null = incomingPdfUrl ?? null;

    if (!pdfPublicUrl && message_type === "follow_up" && quote_id) {
      const { data: quoteRow } = await supabase
        .from("quotes")
        .select("pdf_url, quote_number, client_name")
        .eq("id", quote_id)
        .eq("studio_id", studio_id)
        .maybeSingle();
      if (quoteRow?.pdf_url) {
        pdfPublicUrl = quoteRow.pdf_url;
      }
    }

    // ─── Upload PDF to storage (service role — bypasses RLS) ──────────────────
    if (pdf_base64 && quote_id) {
      try {
        const pdfBytes = Uint8Array.from(atob(pdf_base64), c => c.charCodeAt(0));
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, "0");
        const storagePath = `${studio_id}/quotes/${year}/${month}/${quote_id}.pdf`;
        console.log(`[interakt-send] Uploading PDF to storage: ${storagePath} (${pdfBytes.length} bytes)`);

        const { error: uploadErr } = await supabase.storage
          .from("studio-assets")
          .upload(storagePath, pdfBytes, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadErr) {
          console.error("[interakt-send] Storage upload error:", uploadErr.message);
          return new Response(JSON.stringify({ error: `PDF upload failed: ${uploadErr.message}`, pdf_upload_failed: true }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: urlData } = supabase.storage
          .from("studio-assets")
          .getPublicUrl(storagePath);
        pdfPublicUrl = urlData?.publicUrl ?? null;
        console.log(`[interakt-send] PDF uploaded successfully. Public URL: ${pdfPublicUrl}`);

        if (pdfPublicUrl) {
          await supabase.from("quotes").update({ pdf_url: pdfPublicUrl }).eq("id", quote_id);
        }
      } catch (uploadEx: any) {
        console.error("[interakt-send] PDF upload exception:", uploadEx?.message);
        return new Response(JSON.stringify({ error: `PDF upload exception: ${uploadEx?.message}`, pdf_upload_failed: true }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── Verify PDF accessibility for quote_sent ───────────────────────────────
    if (pdfPublicUrl && (message_type === "quote_sent" || message_type === "follow_up")) {
      try {
        const checkRes = await fetch(pdfPublicUrl, { method: "HEAD" });
        if (!checkRes.ok) {
          console.warn(`[interakt-send] PDF URL not accessible: HTTP ${checkRes.status}`);
        }
      } catch {
        console.warn("[interakt-send] PDF URL accessibility check failed (non-fatal)");
      }
    }

    if (!pdfPublicUrl && message_type === "quote_sent") {
      console.error("[interakt-send] quote_sent template requires a PDF URL but none available");
      return new Response(JSON.stringify({ error: "PDF URL required for quote_sent template but none was provided or generated.", pdf_upload_failed: true }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Phone normalisation ───────────────────────────────────────────────────
    const normalized = normalizePhone(phone);
    if (!normalized) {
      console.error(`[interakt-send] Invalid phone number: ${phone}`);
      return new Response(JSON.stringify({ error: "Invalid phone number format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { countryCode, phoneNumber } = normalized;

    // ─── Build Interakt template payload ──────────────────────────────────────
    const templatePayload: Record<string, any> = {
      name: template_name,
      languageCode: language_code,
    };

    if (pdfPublicUrl) {
      templatePayload.headerValues = [pdfPublicUrl];
      templatePayload.fileName = pdf_filename ?? "quotation.pdf";
    }

    // ─── Resolve body_values ──────────────────────────────────────────────────
    // quote_sent: {{1}} = client name, {{2}} = studio name
    // follow_up:  {{1}} = client name, {{2}} = studio name (same mapping)
    let finalBodyValues = body_values;

    if (message_type === "quote_sent" || message_type === "follow_up") {
      finalBodyValues = [
        body_values?.[0] ?? "there",        // {{1}} — client name
        studio.name ?? "our studio",        // {{2}} — studio/business name from DB
      ];
    }

    if (finalBodyValues?.length) {
      templatePayload.bodyValues = finalBodyValues;
    }
    if (button_values && Object.keys(button_values).length > 0) {
      templatePayload.buttonValues = button_values;
    }

    // Include client_id in callback data so the webhook can map responses
    const callbackData = JSON.stringify({ quote_id, invoice_id, client_id, message_type, studio_id });
    const interaktPayload = {
      countryCode,
      phoneNumber,
      type: "Template",
      callbackData: callbackData.slice(0, 512),
      template: templatePayload,
    };

    console.log("[interakt-send] INTERAKT PAYLOAD:", JSON.stringify({ ...interaktPayload, template: { ...templatePayload, bodyValues: finalBodyValues?.length ? `[${finalBodyValues.length} values]` : undefined } }));

    // ─── Call Interakt ─────────────────────────────────────────────────────────
    const interaktRes = await fetch(INTERAKT_API, {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(interaktPayload),
    });

    const rawBody = await interaktRes.text();
    console.log(`[interakt-send] Interakt HTTP ${interaktRes.status}: ${rawBody}`);

    let interaktData: any = {};
    try { interaktData = JSON.parse(rawBody); } catch { /* non-JSON */ }

    const success = interaktRes.ok && (interaktData.result === true || (interaktData.id && !interaktData.error));
    const messageId: string | null = interaktData.id ?? null;
    const errorMessage = success
      ? null
      : (interaktData.message ?? interaktData.error ?? `HTTP ${interaktRes.status}: ${rawBody.slice(0, 500)}`);

    if (success) {
      console.log(`[interakt-send] SUCCESS ✓ message_id=${messageId}`);
    } else {
      console.error(`[interakt-send] FAILED ✗ error="${errorMessage}"`);
    }

    // ─── Log to whatsapp_logs ──────────────────────────────────────────────────
    await supabase.from("whatsapp_logs").insert({
      studio_id,
      quote_id: quote_id ?? null,
      invoice_id: invoice_id ?? null,
      message_type,
      phone: `${countryCode}${phoneNumber}`,
      status: success ? "sent" : "failed",
      interakt_message_id: messageId,
      error_message: errorMessage,
    });

    // ─── Update client followup tracking (only on success) ─────────────────────
    if (message_type === "follow_up" && client_id) {
      if (success) {
        await supabase.from("clients").update({
          followup_count: currentFollowupCount + 1,
          last_followup_at: new Date().toISOString(),
          last_followup_result: "success",
          updated_at: new Date().toISOString(),
        }).eq("id", client_id).eq("studio_id", studio_id);
        console.log(`[interakt-send] Client ${client_id} followup_count → ${currentFollowupCount + 1}`);
      } else {
        await supabase.from("clients").update({
          last_followup_result: "failed",
          updated_at: new Date().toISOString(),
        }).eq("id", client_id).eq("studio_id", studio_id);
      }
    }

    // ─── Side effects on quotes ────────────────────────────────────────────────
    if (success && quote_id) {
      if (message_type === "quote_sent") {
        const followUpAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
        await supabase.from("quotes").update({
          status: "sent",
          whatsapp_sent_at: new Date().toISOString(),
          follow_up_scheduled_at: followUpAt,
          updated_at: new Date().toISOString(),
        }).eq("id", quote_id).eq("studio_id", studio_id);
        console.log(`[interakt-send] Quote ${quote_id} → status=sent`);
      } else if (message_type === "follow_up") {
        await supabase.from("quotes").update({
          status: "follow_up_pending",
          follow_up_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", quote_id).eq("studio_id", studio_id);
        console.log(`[interakt-send] Quote ${quote_id} → status=follow_up_pending (followup #${followup_number ?? 1})`);
      } else if (message_type === "payment_received") {
        await supabase.from("quotes").update({
          status: "paid",
          updated_at: new Date().toISOString(),
        }).eq("id", quote_id).eq("studio_id", studio_id);
      } else if (message_type === "payment_complete") {
        await supabase.from("quotes").update({
          status: "paid",
          updated_at: new Date().toISOString(),
        }).eq("id", quote_id).eq("studio_id", studio_id);
      }
    }

    return new Response(
      JSON.stringify({ success, message_id: messageId, error: errorMessage, configured: true, pdf_url_used: pdfPublicUrl, followup_count: message_type === "follow_up" && client_id ? (success ? currentFollowupCount + 1 : currentFollowupCount) : undefined }),
      { status: success ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[interakt-send] UNHANDLED EXCEPTION:", err?.message ?? String(err));
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
