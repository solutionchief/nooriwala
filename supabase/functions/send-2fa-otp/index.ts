// Sends a 6-digit verification code to a Gmail address for 2-step verification.
// Includes server-side rate limiting (max 3 sends per 10 min, 60s cooldown).
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

    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^@\s]+@gmail\.com$/i.test(email.trim())) {
      return new Response(JSON.stringify({ error: "Please enter a valid Gmail address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Rate-limit: per user, purpose=two_factor
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("otp_rate_limits")
      .select("attempted_at")
      .eq("user_id", user.id)
      .eq("purpose", "two_factor")
      .gte("attempted_at", since)
      .order("attempted_at", { ascending: false });

    if (recent && recent.length >= 3) {
      return new Response(JSON.stringify({ error: "Too many requests. Try again in 10 minutes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (recent && recent[0]) {
      const lastMs = new Date(recent[0].attempted_at).getTime();
      const wait = 60_000 - (Date.now() - lastMs);
      if (wait > 0) {
        return new Response(JSON.stringify({ error: `Please wait ${Math.ceil(wait/1000)}s before requesting another code.`, cooldown: Math.ceil(wait/1000) }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(code);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await admin.from("email_otp_codes").insert({
      user_id: user.id,
      email: email.toLowerCase(),
      code_hash,
      purpose: "two_factor",
      expires_at,
    });
    await admin.from("otp_rate_limits").insert({ user_id: user.id, purpose: "two_factor" });

    try {
      await admin.rpc("enqueue_email", {
        p_to: email,
        p_subject: "Your Noori Wala 2-step verification code",
        p_html: `<p>Your 2-step verification code is <b style="font-size:22px;letter-spacing:4px">${code}</b></p><p>It expires in 10 minutes. If you did not request this, ignore this email.</p>`,
        p_purpose: "transactional",
      });
    } catch (_) {
      console.log(`[dev] 2FA OTP for ${email}: ${code}`);
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
