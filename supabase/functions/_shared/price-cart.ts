// Server-side cart pricing. Used by `payu-hash` and `create-cod-order` to
// guarantee that order totals are derived from the products / flash_sales /
// coupons tables — NEVER from client-supplied amounts.
//
// Business rules mirrored from src/pages/Checkout.tsx + src/lib/shipping.ts +
// src/lib/codEligibility.ts (keep in sync if those change).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const FREE_SHIPPING_THRESHOLD = 999;
export const WB_HANDLING_CHARGE = 20;
export const STANDARD_SHIPPING_FEE = 99;
export const COD_FEE = 40;
export const COD_MAX_ORDER = 1000;
const WB_PINCODE_PREFIXES = ['70', '71', '72', '73', '74'];

export interface ClientCartItem {
  product_id: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export interface PricedItem {
  product_id: string;
  product_name: string;
  image: string | null;
  price: number;          // unit price (after best applicable discount)
  original_price: number; // catalog price
  quantity: number;
  size: string | null;
  color: string | null;
  is_flash_sale: boolean;
}

export interface PricedCart {
  items: PricedItem[];
  subtotal: number;
  coupon_discount: number;
  coupon_code: string | null;
  shipping_cost: number;
  cod_fee: number;
  total: number;
  has_flash_sale_items: boolean;
}

export class PriceCartError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isWestBengal(state?: string, pincode?: string): boolean {
  if (state && state.trim().toLowerCase() === 'west bengal') return true;
  if (pincode && /^\d{6}$/.test(pincode)) {
    return WB_PINCODE_PREFIXES.includes(pincode.substring(0, 2));
  }
  return false;
}

function calculateShipping(subtotal: number, state?: string, pincode?: string, hasTestItem?: boolean) {
  const wb = isWestBengal(state, pincode);
  if (hasTestItem) return 0;
  if (wb) return WB_HANDLING_CHARGE;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return STANDARD_SHIPPING_FEE;
}

export interface PriceCartInput {
  items: ClientCartItem[];
  coupon_code?: string | null;
  shipping_address: { state?: string; pincode?: string };
  payment_method: 'cod' | 'online';
}

export async function priceCart(
  admin: SupabaseClient,
  input: PriceCartInput,
): Promise<PricedCart> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new PriceCartError('Cart is empty', 400);
  }

  // Sanitize quantities
  const sanitized = input.items.map((it) => {
    const qty = Math.max(1, Math.min(50, Math.floor(Number(it.quantity) || 0)));
    if (!it.product_id || typeof it.product_id !== 'string') {
      throw new PriceCartError('Invalid product_id', 400);
    }
    return {
      product_id: it.product_id,
      quantity: qty,
      size: it.size ?? null,
      color: it.color ?? null,
    };
  });

  const ids = Array.from(new Set(sanitized.map((i) => i.product_id)));

  // Fetch products by id
  const { data: products, error: prodErr } = await admin
    .from('products')
    .select('id, name, image, price, discount, in_stock')
    .in('id', ids);
  if (prodErr) throw new PriceCartError('Failed to load products: ' + prodErr.message, 500);

  const productMap = new Map<string, any>((products || []).map((p) => [p.id, p]));
  for (const id of ids) {
    if (!productMap.has(id)) throw new PriceCartError(`Product not found: ${id}`, 400);
    const p = productMap.get(id);
    if (p.in_stock === false) throw new PriceCartError(`Product out of stock: ${p.name}`, 400);
  }

  // Fetch active flash sales covering these products
  const { data: flashSales } = await admin
    .from('flash_sales')
    .select('product_ids, discount_percentage, is_active, start_time, end_time')
    .eq('is_active', true);

  const now = Date.now();
  const flashDiscountByProduct = new Map<string, number>();
  for (const fs of flashSales || []) {
    const start = new Date(fs.start_time).getTime();
    const end = new Date(fs.end_time).getTime();
    if (!(start <= now && end > now)) continue;
    const pct = Number(fs.discount_percentage) || 0;
    for (const pid of (fs.product_ids || []) as string[]) {
      const existing = flashDiscountByProduct.get(pid) || 0;
      if (pct > existing) flashDiscountByProduct.set(pid, pct);
    }
  }

  // Compute priced items
  const pricedItems: PricedItem[] = sanitized.map((it) => {
    const p = productMap.get(it.product_id);
    const catalogPrice = Math.round(Number(p.price));
    const flashPct = flashDiscountByProduct.get(p.id) || 0;
    const catalogDiscountPct = Math.max(0, Math.min(100, Number(p.discount) || 0));
    // Best applicable discount wins
    const bestPct = Math.max(flashPct, catalogDiscountPct);
    const unit = Math.round(catalogPrice * (1 - bestPct / 100));
    return {
      product_id: p.id,
      product_name: p.name,
      image: p.image || null,
      price: unit,
      original_price: catalogPrice,
      quantity: it.quantity,
      size: it.size,
      color: it.color,
      is_flash_sale: flashPct > 0,
    };
  });

  const subtotal = pricedItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const hasFlashSaleItems = pricedItems.some((it) => it.is_flash_sale);
  const nonFlashSubtotal = pricedItems
    .filter((it) => !it.is_flash_sale)
    .reduce((s, it) => s + it.price * it.quantity, 0);

  // Coupon validation
  let couponDiscount = 0;
  let couponCode: string | null = null;
  const code = (input.coupon_code || '').trim().toUpperCase();
  if (code) {
    const { data: coupon } = await admin
      .from('coupons')
      .select('code, discount_type, discount_value, min_order_value, is_active, expires_at, max_uses, used_count')
      .eq('code', code)
      .maybeSingle();
    if (!coupon) throw new PriceCartError('Invalid coupon code', 400);
    if (!coupon.is_active) throw new PriceCartError('Coupon is not active', 400);
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) {
      throw new PriceCartError('Coupon has expired', 400);
    }
    if (coupon.max_uses && coupon.max_uses > 0 && (coupon.used_count || 0) >= coupon.max_uses) {
      throw new PriceCartError('Coupon usage limit reached', 400);
    }
    if (coupon.min_order_value && subtotal < Number(coupon.min_order_value)) {
      throw new PriceCartError(`Minimum order ₹${coupon.min_order_value} required for this coupon`, 400);
    }
    const base = hasFlashSaleItems ? nonFlashSubtotal : subtotal;
    if (base > 0) {
      if (coupon.discount_type === 'percentage') {
        couponDiscount = Math.round(base * (Number(coupon.discount_value) / 100));
      } else {
        couponDiscount = Math.min(Number(coupon.discount_value), base);
      }
      couponCode = coupon.code;
    }
  }

  // Shipping
  const hasTestItem = pricedItems.some((it) => it.price <= 1);
  const shippingCost = calculateShipping(
    subtotal,
    input.shipping_address?.state,
    input.shipping_address?.pincode,
    hasTestItem,
  );

  // COD validation + fee
  let codFee = 0;
  if (input.payment_method === 'cod') {
    if (hasFlashSaleItems) throw new PriceCartError('COD not available on Flash Sale items', 400);
    const postCoupon = subtotal - couponDiscount;
    if (postCoupon > COD_MAX_ORDER) {
      throw new PriceCartError(`COD available only on orders up to ₹${COD_MAX_ORDER}`, 400);
    }
    codFee = COD_FEE;
  }

  const total = Math.max(0, subtotal - couponDiscount + shippingCost + codFee);

  return {
    items: pricedItems,
    subtotal,
    coupon_discount: couponDiscount,
    coupon_code: couponCode,
    shipping_cost: shippingCost,
    cod_fee: codFee,
    total,
    has_flash_sale_items: hasFlashSaleItems,
  };
}
