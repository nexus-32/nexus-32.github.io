import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TranslateRequest = {
  targetLanguage: string;
  texts: string[];
  sourceLanguage?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetLanguage, texts, sourceLanguage } = (await req.json()) as TranslateRequest;

    if (!targetLanguage || !Array.isArray(texts)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleaned = texts
      .map((t) => (typeof t === "string" ? t : ""))
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (cleaned.length === 0) {
      return new Response(JSON.stringify({ translations: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sourceHint = sourceLanguage ? ` Source language hint: ${sourceLanguage}.` : "";

    const systemPrompt = `You are a precise UI translator.${sourceHint} Translate each string into ${targetLanguage}.\n\nRules:\n- Preserve punctuation, emojis, and capitalization style when reasonable.\n- Do NOT translate placeholders like {name}, {{name}}, %s, %d, :id.\n- Do NOT translate URLs.\n- Return ONLY valid JSON in the form: {"translations":["...","..."]} with the same number of items as input.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({ texts: cleaned }),
          },
        ],
        stream: false,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Translate gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Translate gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ translations: cleaned }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const match = content.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : JSON.parse(content);
    const translations: unknown = parsed?.translations;

    if (!Array.isArray(translations)) {
      return new Response(JSON.stringify({ translations: cleaned }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const out = translations.map((t: unknown, idx: number) => {
      if (typeof t === "string" && t.trim().length > 0) return t;
      return cleaned[idx] ?? "";
    });

    return new Response(JSON.stringify({ translations: out }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
