import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Email2FARequest =
  | { action: "send" }
  | { action: "verify"; code: string };

function randomCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
    if (!RESEND_FROM_EMAIL) throw new Error("RESEND_FROM_EMAIL is not configured");

    const authHeader = req.headers.get("Authorization") ?? "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase env not configured");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const body = (await req.json()) as Email2FARequest;
    if (!body || (body as any).action === undefined) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const userId = user.id;
    const email = user.email;
    if (!email) throw new Error("User email is missing");

    if (body.action === "send") {
      const code = randomCode();
      const codeHash = await sha256Hex(code);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase
        .from("email_2fa_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString());

      const { error: insertErr } = await supabase.from("email_2fa_codes").insert({
        user_id: userId,
        code_hash: codeHash,
        expires_at: expiresAt,
      });
      if (insertErr) throw insertErr;

      const subject = "MindWeaver: код двухэтапной проверки";
      const html = `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.4">
          <h2>Код двухэтапной проверки</h2>
          <p>Ваш код: <b style="font-size: 22px; letter-spacing: 2px">${code}</b></p>
          <p>Код действует 5 минут. Если вы не запрашивали код — просто проигнорируйте это письмо.</p>
        </div>
      `;

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: [email],
          subject,
          html,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.error("Resend error:", resp.status, t);
        return new Response(JSON.stringify({ error: "Email provider error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, expiresInSec: 300 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = (body as any).code;
    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();

    const { data: rows, error: selectErr } = await supabase
      .from("email_2fa_codes")
      .select("id, code_hash, attempts, expires_at")
      .eq("user_id", userId)
      .is("consumed_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectErr) throw selectErr;
    const row = rows?.[0];
    if (!row) throw new Error("Код не найден или истёк. Запросите новый.");

    const providedHash = await sha256Hex(code.trim());

    if (providedHash !== row.code_hash) {
      const attempts = (row.attempts ?? 0) + 1;
      await supabase.from("email_2fa_codes").update({ attempts }).eq("id", row.id);
      throw new Error("Неверный код");
    }

    const { error: consumeErr } = await supabase
      .from("email_2fa_codes")
      .update({ consumed_at: nowIso })
      .eq("id", row.id);
    if (consumeErr) throw consumeErr;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("email2fa error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
