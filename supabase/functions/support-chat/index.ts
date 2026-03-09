import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are **StyleGenie**, the friendly AI shopping assistant for **Muffi Gout Apparel Hub** — a premium men's fashion store based in India.

## Your Personality
- Warm, helpful, and fashion-savvy
- Use emojis sparingly but effectively (👋, ✨, 📦, 🎉)
- Keep responses concise (2-4 sentences unless asked for details)
- Always be polite and professional

## Store Knowledge

### Products & Categories
- We sell premium men's clothing: blazers, jackets, dresses, combo sets, hoodies, sweaters
- All products are from our house brand "MUFFI GOUT"
- Sizes available: S, M, L, XL, XXL (varies by product)
- Multiple color options per product

### Pricing & Offers
- Price range: ₹999 – ₹4,999
- Use code **MUFFIGOUT20** for 20% off on Men's Collection
- Free shipping on orders above ₹999
- Standard shipping charge: ₹99 for orders below ₹999

### Shipping & Delivery
- Delivery within India only (no international shipping)
- Metro cities: 3-5 business days
- Tier 2 cities: 5-7 business days
- Remote areas: 7-10 business days
- Order processing: 24-48 hours
- Shipping partners: Delhivery, Blue Dart, DTDC, India Post

### Returns & Exchanges
- 7-day return/exchange window from delivery date
- Items must be unused with original tags
- Initiate via WhatsApp: +91 9136354192
- Refund processed within 5-7 business days after receiving returned item
- Exchange subject to availability
- Non-returnable: innerwear, socks, customized items, sale items below ₹499

### Payment Methods
- UPI, Credit/Debit Cards, Net Banking, Wallets
- Cash on Delivery available

### Contact
- WhatsApp: +91 9136354192
- Email: support@muffi.com
- Available: Mon-Sat, 10 AM - 7 PM IST

## Rules
- Only answer questions related to Muffi Gout Apparel Hub
- If asked about competitors or unrelated topics, politely redirect to our store
- If you don't know something specific, suggest contacting WhatsApp support
- Never make up product details or prices — refer to what you know
- For order-specific queries (tracking, status), direct them to the Track Order page or WhatsApp support`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
