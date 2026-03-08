import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  category: string;
  subcategory: string;
  image: string;
  additional_images: string[];
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  sizes: string[];
  colors: { name: string; hex: string; image?: string }[];
  tags: string[];
  in_stock: boolean | null;
  description: string | null;
  created_at: string;
}

// Convert DB product to the format used by ProductCard & ProductDetail
export interface StoreProduct {
  id: string;
  name: string;
  category: 'men';
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string; image?: string }[];
  rating: number;
  reviews: number;
  description: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export const dbToStoreProduct = (p: DbProduct): StoreProduct => {
  const colors = (p.colors || []).map((c: any) => {
    if (typeof c === 'string') return { name: c, hex: '#000' };
    return { name: c.name, hex: c.hex, image: c.image };
  });

  return {
    id: p.id,
    name: p.name,
    category: 'men',
    price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    discount: p.discount ? Number(p.discount) : undefined,
    images: [p.image, ...(p.additional_images || [])].filter(Boolean),
    sizes: p.sizes || [],
    colors: colors.length > 0 ? colors : [{ name: 'Default', hex: '#000' }],
    rating: 4.5,
    reviews: 0,
    description: p.description || '',
    isNew: false,
    isFeatured: true,
  };
};

export const useDbProducts = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const storeProducts = data.map((p: any) => dbToStoreProduct(p as DbProduct));

        // Fetch review stats for all products
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('product_id, rating');

        if (reviewData) {
          const statsMap: Record<string, { total: number; count: number }> = {};
          (reviewData as any[]).forEach((r: any) => {
            if (!statsMap[r.product_id]) statsMap[r.product_id] = { total: 0, count: 0 };
            statsMap[r.product_id].total += r.rating;
            statsMap[r.product_id].count += 1;
          });
          storeProducts.forEach((p) => {
            const stats = statsMap[p.id];
            if (stats) {
              p.rating = Math.round((stats.total / stats.count) * 10) / 10;
              p.reviews = stats.count;
            }
          });
        }

        setProducts(storeProducts);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return { products, loading };
};

export const useDbProduct = (id: string) => {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setProduct(dbToStoreProduct(data as unknown as DbProduct));
      }
      setLoading(false);
    };
    if (id) fetchProduct();
  }, [id]);

  return { product, loading };
};
