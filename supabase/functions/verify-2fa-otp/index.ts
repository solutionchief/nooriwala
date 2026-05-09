// Verifies a 6-digit Gmail OTP for 2-step verification and, on success,
// enables 2FA on the user's profile (storing the verified Gmail).
// Logs all attempts to security_events.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = req.headers.get("user-agent") ?? null;
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, code, mode } = await req.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const code_hash = await sha256(String(code));

    const logEvent = async (event_type: string, metadata: Record<string, unknown> = {}) => {
      try {
        await admin.from("security_events").insert({
          user_id: user.id,
          event_type,
          metadata: { email: String(email).toLowerCase(), mode, ...metadata },
          ip_address: ip,
          user_agent: ua,
        });
      } catch (_) { /* swallow */ }
    };

    const { data: rows } = await admin
      .from("email_otp_codes")
      .select("id, expires_at, consumed")
      .eq("user_id", user.id)
      .eq("email", String(email).toLowerCase())
      .eq("purpose", "two_factor")
      .eq("code_hash", code_hash)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = rows?.[0];
    if (!row) {
      await logEvent("2fa_challenge_failed", { reason: "invalid_code" });
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (row.consumed) {
      await logEvent("2fa_challenge_failed", { reason: "code_used" });
      return new Response(JSON.stringify({ error: "Code already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await logEvent("2fa_challenge_failed", { reason: "expired" });
      return new Response(JSON.stringify({ error: "Code expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("email_otp_codes").update({ consumed: true }).eq("id", row.id);

    if (mode === "enroll" || mode === "change") {
      await admin
        .from("profiles")
        .update({ two_factor_email: String(email).toLowerCase(), two_factor_enabled: true })
        .eq("user_id", user.id);
      await logEvent(mode === "enroll" ? "2fa_enrolled" : "2fa_email_changed");
    } else {
      await logEvent("2fa_challenge_succeeded");
    }

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
