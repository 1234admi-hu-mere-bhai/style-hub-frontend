import { useEffect, useState } from 'react';
import { Eye, ShoppingBag, Flame } from 'lucide-react';
import { useProductStats } from '@/hooks/useProductStats';

interface Props {
  productId: string;
}

// Smoothly animate a number toward `value`
function useAnimatedNumber(value: number, duration = 800) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return display;
}

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const ProductStatsCard = ({ productId }: Props) => {
  const { views, purchases, loading } = useProductStats(productId);
  const viewsAnim = useAnimatedNumber(views);
  const purchasesAnim = useAnimatedNumber(purchases);
  const trending = views >= 50 || purchases >= 5;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/10 p-4 backdrop-blur-sm">
      {/* Animated glow blob */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/30 blur-3xl animate-pulse" />

      <div className="relative flex items-stretch gap-3">
        {/* Views */}
        <div className="flex-1 flex items-center gap-3 rounded-xl bg-background/60 p-3 border border-border/50">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Eye className="h-5 w-5 text-primary" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tabular-nums">
              {loading ? '—' : formatCount(viewsAnim)}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              People viewing
            </div>
          </div>
        </div>

        {/* Purchases */}
        <div className="flex-1 flex items-center gap-3 rounded-xl bg-background/60 p-3 border border-border/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
            <ShoppingBag className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tabular-nums">
              {loading ? '—' : formatCount(purchasesAnim)}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Already bought
            </div>
          </div>
        </div>
      </div>

      {trending && (
        <div className="relative mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
          <Flame className="h-3.5 w-3.5 animate-pulse" />
          <span>Trending now — live count updating</span>
        </div>
      )}
    </div>
  );
};

export default ProductStatsCard;
