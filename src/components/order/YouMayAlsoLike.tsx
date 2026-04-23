import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { dbToStoreProduct, type DbProduct, type StoreProduct } from '@/hooks/useDbProducts';

interface YouMayAlsoLikeProps {
  excludeProductId: string;
}

const YouMayAlsoLike = ({ excludeProductId }: YouMayAlsoLikeProps) => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Look up the source product's subcategory (best-effort)
      let subcategory: string | null = null;
      const { data: src } = await supabase
        .from('products')
        .select('subcategory')
        .eq('id', excludeProductId)
        .maybeSingle();
      if (src) subcategory = (src as any).subcategory || null;

      // First try same subcategory
      let rows: DbProduct[] = [];
      if (subcategory) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('in_stock', true)
          .eq('subcategory', subcategory)
          .neq('id', excludeProductId)
          .limit(10);
        rows = (data || []) as unknown as DbProduct[];
      }

      // Fallback: if not enough, fetch any products
      if (rows.length < 4) {
        const { data: fallback } = await supabase
          .from('products')
          .select('*')
          .eq('in_stock', true)
          .neq('id', excludeProductId)
          .limit(10);
        rows = (fallback || []) as unknown as DbProduct[];
      }

      if (!cancelled) {
        setProducts(rows.map(dbToStoreProduct));
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [excludeProductId]);

  if (loading || products.length === 0) return null;

  return (
    <section className="bg-card border-b border-border px-4 py-5">
      <h2 className="font-bold text-base mb-3">You May Also Like</h2>
      <div
        className="-mx-4 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-3 pb-1">
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="group block w-36 shrink-0"
            >
              <div className="relative aspect-[3/4] bg-secondary rounded-lg overflow-hidden mb-2">
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                {p.discount ? (
                  <span className="absolute top-1.5 left-1.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                    -{p.discount}%
                  </span>
                ) : null}
              </div>
              <p className="text-xs font-medium line-clamp-2 leading-tight min-h-[2rem]">
                {p.name}
              </p>
              {p.reviews > 0 && (
                <div className="flex items-center gap-0.5 mt-1">
                  <Star size={10} className="fill-gold text-gold" />
                  <span className="text-[10px] text-muted-foreground">
                    {p.rating} ({p.reviews})
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-bold">{formatPrice(p.price)}</span>
                {p.originalPrice && p.originalPrice > p.price && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {formatPrice(p.originalPrice)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default YouMayAlsoLike;
