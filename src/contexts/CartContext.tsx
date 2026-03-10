import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size: string, color: string) => void;
  updateQuantity: (id: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem | null) => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  revalidateCartPrices: () => Promise<boolean>; // returns true if flash sale ended and prices changed
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart-items');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [buyNowItem, setBuyNowItemState] = useState<CartItem | null>(() => {
    try {
      const saved = localStorage.getItem('buy-now-item');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setBuyNowItem = (item: CartItem | null) => {
    setBuyNowItemState(item);
  };

  useEffect(() => {
    localStorage.setItem('cart-items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (buyNowItem) {
      localStorage.setItem('buy-now-item', JSON.stringify(buyNowItem));
    } else {
      localStorage.removeItem('buy-now-item');
    }
  }, [buyNowItem]);

  // Revalidate cart prices against current DB prices & active flash sales
  const revalidateCartPrices = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) return false;

    const productIds = [...new Set(items.map(i => i.id))];

    // Fetch current products and active flash sale in parallel
    const now = new Date().toISOString();
    const [productsResult, flashResult] = await Promise.all([
      supabase.from('products').select('id, price, original_price, discount').in('id', productIds),
      supabase
        .from('flash_sales' as any)
        .select('id, discount_percentage, product_ids')
        .eq('is_active', true)
        .gt('end_time', now)
        .lte('start_time', now)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const dbProducts = productsResult.data as { id: string; price: number; original_price: number | null; discount: number | null }[] | null;
    if (!dbProducts) return false;

    const flashSale = (flashResult.data as any[] | null)?.[0] ?? null;
    const flashProductIds: string[] = flashSale?.product_ids || [];
    const flashDiscount: number = flashSale?.discount_percentage || 0;

    const priceMap = new Map<string, { price: number; originalPrice?: number }>();
    for (const p of dbProducts) {
      const isFlashSaleActive = flashProductIds.includes(p.id);
      if (isFlashSaleActive) {
        const origPrice = p.original_price || p.price;
        const flashPrice = Math.round(origPrice * (1 - flashDiscount / 100));
        priceMap.set(p.id, { price: flashPrice, originalPrice: origPrice });
      } else {
        // No active flash sale — use base price
        // If product has its own discount (non-flash), keep that
        if (p.original_price && p.discount && p.discount > 0) {
          priceMap.set(p.id, { price: p.price, originalPrice: p.original_price });
        } else {
          priceMap.set(p.id, { price: p.original_price || p.price, originalPrice: undefined });
        }
      }
    }

    let flashSaleEnded = false;

    setItems(prev => {
      let changed = false;
      const updated = prev.map(item => {
        const current = priceMap.get(item.id);
        if (!current) return item;
        if (item.price !== current.price || item.originalPrice !== current.originalPrice) {
          // Detect flash sale ending: item had originalPrice (was on sale) but now doesn't
          if (item.originalPrice && item.originalPrice > item.price && !current.originalPrice) {
            flashSaleEnded = true;
          }
          changed = true;
          return { ...item, price: current.price, originalPrice: current.originalPrice };
        }
        return item;
      });
      return changed ? updated : prev;
    });

    // Also revalidate buyNowItem
    if (buyNowItem) {
      const current = priceMap.get(buyNowItem.id);
      if (current && (buyNowItem.price !== current.price || buyNowItem.originalPrice !== current.originalPrice)) {
        if (buyNowItem.originalPrice && buyNowItem.originalPrice > buyNowItem.price && !current.originalPrice) {
          flashSaleEnded = true;
        }
        setBuyNowItemState({ ...buyNowItem, price: current.price, originalPrice: current.originalPrice });
      }
    }

    return flashSaleEnded;
  }, [items, buyNowItem]);

  // Revalidate on mount and every 30 seconds
  useEffect(() => {
    revalidateCartPrices();
    const interval = setInterval(revalidateCartPrices, 30000);
    return () => clearInterval(interval);
  }, [revalidateCartPrices]);

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === item.id && i.size === item.size && i.color === item.color
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string, size: string, color: string) => {
    setItems(prev => prev.filter(
      i => !(i.id === id && i.size === size && i.color === color)
    ));
  };

  const updateQuantity = (id: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.id === id && i.size === size && i.color === color
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);
  const [isCartOpen, setCartOpen] = useState(false);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, buyNowItem, setBuyNowItem, isCartOpen, setCartOpen, revalidateCartPrices }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
