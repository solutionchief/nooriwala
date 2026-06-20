// Logs OTP send / verify / failure events into security_events.
// Called from the client whenever a phone or email OTP send/verify is
// attempted, so the Security Center has a complete audit trail.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_EVENTS = new Set([
  "phone_otp_send_attempt",
  "phone_otp_send_failed",
  "phone_otp_verify_failed",
  "phone_otp_verify_succeeded",
  "email_otp_send_attempt",
  "email_otp_send_failed",
  "2fa_otp_send_attempt",
  "2fa_otp_send_failed",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    // For phone OTP attempts the user may not be authenticated yet — accept anonymous too.
    const { data: { user } } = await userClient.auth.getUser();

    const { event_type, metadata } = await req.json();
    if (!event_type || !ALLOWED_EVENTS.has(event_type)) {
      return new Response(JSON.stringify({ error: "invalid event_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only log events for the authenticated session user. Never trust a
    // body-supplied user_id — that would let unauthenticated callers forge
    // security events in any user's audit log.
    const uid = user?.id ?? null;
    if (!uid) {
      // Pre-signup / anonymous attempt — silently skip the insert so no audit
      // record can be attributed to an arbitrary UUID.
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent") ?? null;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("security_events").insert({
      user_id: uid,
      event_type,
      metadata: metadata ?? {},
      ip_address: ip,
      user_agent: ua,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
