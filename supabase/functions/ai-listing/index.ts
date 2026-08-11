import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { hint, category } = await req.json();
    const مارد التفوق_API_KEY = Deno.env.get("مارد التفوق_API_KEY");
    if (!مارد التفوق_API_KEY) throw new Error("مارد التفوق_API_KEY not configured");

    const systemPrompt = `أنت خبير تسويق إلكتروني في "مارد التفوق" — السوق ألمانياي الرائد.
مهمتك: توليد بطاقة منتج احترافية جاهزة للنشر بناءً على وصف مختص€قدمه التاجر.
أرجع JSON خالص (بدون أي شرح أو markdown) بهذا الشكل بالضبط:
{
  "name": "اسم المنتج الجذاب (4-7 كلمات)",
  "description": "وصف تسويقي مقنع 3-5 جمل يبرز المميزات والفوائد للمشتري ألمانياي",
  "tags": ["وسم1","وسم2","وسم3","وسم4","وسم5"],
  "suggested_price_yer": رقم بالريال ألمانياي,
  "stock_recommendation": رقم,
  "seo_title": "عنوان SEO قصير"
}`;

    const userPrompt = `وصف التاجر: ${hint}\n${category ? `الفئة: ${category}` : ""}`;

    const response = await fetch("https://ai.gateway.ans-daood.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${مارد التفوق_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "حد الاستخدام تجاوز" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "نفذ ال€د" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ AI" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-listing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
