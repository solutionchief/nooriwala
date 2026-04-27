// AI face-match: compare a freshly captured selfie to the user's profile photo using Lovable AI (Gemini vision).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = {
  type: "object",
  properties: {
    same_person: { type: "boolean" },
    confidence: { type: "number", description: "0-1" },
    liveness_ok: { type: "boolean", description: "Whether the selfie looks like a live person, not a photo of a screen/printout" },
    reason: { type: "string" },
  },
  required: ["same_person", "confidence", "liveness_ok", "reason"],
  additionalProperties: false,
} as const;

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
    const { selfie_data_url, verification_id } = await req.json();
    if (!selfie_data_url || !verification_id) {
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await admin.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle();
    if (!profile?.avatar_url) {
      return new Response(JSON.stringify({ error: "Add a profile photo first — we need it to match your selfie." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a strict identity verifier. Compare two face photos and assess if they are the same person, and whether the second image shows a live person rather than a screen photo or printout." },
          { role: "user", content: [
            { type: "text", text: "Image 1 = stored profile photo. Image 2 = freshly captured selfie. Decide same_person + liveness." },
            { type: "image_url", image_url: { url: profile.avatar_url } },
            { type: "image_url", image_url: { url: selfie_data_url } },
          ] },
        ],
        tools: [{ type: "function", function: { name: "report_match", description: "Report match result", parameters: SCHEMA } }],
        tool_choice: { type: "function", function: { name: "report_match" } },
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Verification service busy. Try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI verification failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResp.json();
    const args = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const result = args ? JSON.parse(args) : null;
    if (!result) return new Response(JSON.stringify({ error: "AI returned no result" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const passed = result.same_person && result.liveness_ok && (result.confidence ?? 0) >= 0.6;

    // Upload selfie to private bucket
    const buf = Uint8Array.from(atob(selfie_data_url.split(",")[1]), c => c.charCodeAt(0));
    const path = `${user.id}/${verification_id}.jpg`;
    await admin.storage.from("verification-selfies").upload(path, buf, { contentType: "image/jpeg", upsert: true });

    await admin.from("change_number_verifications")
      .update({ selfie_verified: passed, selfie_url: path, selfie_score: result.confidence ?? null })
      .eq("id", verification_id)
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ ok: passed, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
