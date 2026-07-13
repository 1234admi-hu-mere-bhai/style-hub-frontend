import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const gate = requireServiceRole(req, corsHeaders);
  if (gate) return gate;



  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { product_id } = await req.json();
    if (!product_id || typeof product_id !== "string") {
      return new Response(JSON.stringify({ error: "product_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: product } = await admin
      .from("products")
      .select("id, name, image, in_stock")
      .eq("id", product_id)
      .maybeSingle();

    if (!product || !product.in_stock) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pending } = await admin
      .from("stock_notifications")
      .select("id, user_id")
      .eq("product_id", product_id)
      .is("notified_at", null);

    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const row of pending) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify({
            userId: row.user_id,
            title: "Back in stock!",
            message: `${product.name} is available again. Tap to grab yours.`,
            url: `/product/${product.id}`,
            tag: `back-in-stock-${product.id}`,
            category: "new_arrivals",
            dedupeKey: `back-in-stock-${product.id}-${row.user_id}`,
          }),
        });
        if (res.ok) sent++;

        // In-app notification
        await admin.from("notifications").insert({
          user_id: row.user_id,
          title: "Back in stock",
          message: `${product.name} is available again. Open the app to grab yours.`,
          type: "stock",
        });
      } catch (e) {
        console.error("notify-back-in-stock send failed", e);
      }
    }

    await admin
      .from("stock_notifications")
      .update({ notified_at: new Date().toISOString() })
      .eq("product_id", product_id)
      .is("notified_at", null);

    return new Response(JSON.stringify({ sent, total: pending.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-back-in-stock error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
