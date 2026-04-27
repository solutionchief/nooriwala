// Send a 6-digit OTP code to a Gmail address for change-number verification.
// Uses the Lovable Email queue (enqueue_email RPC) when available; otherwise logs the code.
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "invalid email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(code);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("email_otp_codes").insert({
      user_id: user.id,
      email: email.toLowerCase(),
      code_hash,
      purpose: "change_number",
      expires_at,
    });

    // Try queue email; fall back to console log if RPC not present.
    try {
      await supabase.rpc("enqueue_email", {
        p_to: email,
        p_subject: "Your Chief Messenger verification code",
        p_html: `<p>Your verification code is <b style="font-size:22px;letter-spacing:4px">${code}</b></p><p>It expires in 10 minutes.</p>`,
        p_purpose: "transactional",
      });
    } catch (_) {
      console.log(`[dev] OTP for ${email}: ${code}`);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
