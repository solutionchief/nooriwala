// Finalize a phone-number change once all 3 steps verified. Updates auth user phone + profile.phone.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { verification_id } = await req.json();

    const { data: v } = await admin.from("change_number_verifications").select("*").eq("id", verification_id).eq("user_id", user.id).maybeSingle();
    if (!v) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!(v.phone_verified && v.email_verified && v.selfie_verified)) {
      return new Response(JSON.stringify({ error: "All 3 steps must be verified" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update auth user phone
    const { error: authErr } = await admin.auth.admin.updateUserById(user.id, { phone: v.new_phone });
    if (authErr) {
      console.error(authErr);
      return new Response(JSON.stringify({ error: authErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await admin.from("profiles").update({ phone: v.new_phone }).eq("user_id", user.id);
    await admin.from("change_number_verifications").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", verification_id);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
