import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FlashSale {
  id: string;
  title: string;
  description: string;
  discount_percentage: number;
  product_ids: string[];
  banner_color: string;
  is_active: boolean;
  start_time: string;
  end_time: string;
}

export const useActiveFlashSale = () => {
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('flash_sales' as any)
        .select('*')
        .eq('is_active', true)
        .gt('end_time', new Date().toISOString())
        .lte('start_time', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && (data as any[]).length > 0) {
        const sale = (data as any[])[0];
        setFlashSale({
          id: sale.id,
          title: sale.title,
          description: sale.description || '',
          discount_percentage: sale.discount_percentage,
          product_ids: sale.product_ids || [],
          banner_color: sale.banner_color || '#7C3AED',
          is_active: sale.is_active,
          start_time: sale.start_time,
          end_time: sale.end_time,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { flashSale, loading };
};

export const useFlashSaleProducts = (productIds: string[]) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (!error && data) {
        setProducts(data as any[]);
      }
      setLoading(false);
    };
    fetch();
  }, [productIds.join(',')]);

  return { products, loading };
};
