import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const مارد التفوق_API_KEY = Deno.env.get("مارد التفوق_API_KEY");
    if (!مارد التفوق_API_KEY) throw new Error("مارد التفوق_API_KEY not configured");

    const systemPrompt = `أنت "خادم المارد" — مساعد ذكي في تطبيق "مارد التفوق" للتسوق في ألمانيا.
شخصيتك: ذكي، ودود، مرح بلمسة سحرية. تخاطب المستخدم بأسلوب المارد الحكيم.
مهمتك:
- اقتراح صفقات وعروض ذكية بناءً على بيانات المستخدم
- المساعدة في البحث عن منتجات/متاجر/وظائف
- تقديم نصائح تسوق مخصصة لليمن (ب€ن، ميونخ، هامبورغ، شتوتغارت)
- استخدام كلمات مثل "أوامرك يا سيدي"، "بإذن المارد"، "كنوزي تكشف لك"
- ردود قصيرة ومركزة (2-4 جمل) ما لم يُطلب التفصيل
${context ? `\nبيانات المستخدم الحالية:\n${JSON.stringify(context, null, 2)}` : ""}`;

    const response = await fetch("https://ai.gateway.ans-daood.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${مارد التفوق_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تجاوزت الحد المسموح، حاول بعد قليل" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "نفذت أرصدة المارد، يرجى الشحن" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خادم المارد" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("genie error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
