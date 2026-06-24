import { useEffect, useState } from 'react';
import { Eye, ShoppingBag, Flame, TrendingUp, Sparkles } from 'lucide-react';
import { useProductStats } from '@/hooks/useProductStats';

interface Props {
  productId: string;
}

// Smoothly animate a number toward `value`
function useAnimatedNumber(value: number, duration = 900) {
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
    <div className="group relative overflow-hidden rounded-2xl p-[1.5px] bg-gradient-to-br from-primary/60 via-accent/40 to-primary/60 shadow-glow">
      {/* Rotating conic shimmer border */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'conic-gradient(from var(--a,0deg), transparent 0deg, hsl(var(--primary)/0.6) 80deg, transparent 160deg, hsl(var(--accent)/0.6) 240deg, transparent 320deg)',
          animation: 'statsSpin 6s linear infinite',
        }}
      />

      <div className="relative rounded-[14px] bg-gradient-to-br from-background via-secondary/40 to-background p-4 overflow-hidden">
        {/* Floating glow blobs */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl animate-pulse" />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-accent/25 blur-3xl animate-pulse"
          style={{ animationDelay: '1.2s' }}
        />

        {/* Header */}
        <div className="relative mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Live activity
          </div>
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-success animate-ping" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          {/* Views */}
          <div className="group/card relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background/80 to-background p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]">
            <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-primary/20 blur-2xl transition-opacity group-hover/card:opacity-100" />
            <div className="relative flex items-start gap-2.5">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow">
                <Eye className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inset-0 rounded-full bg-primary animate-ping" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                </span>
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-2xl font-extrabold tabular-nums bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                  {loading ? '—' : formatCount(viewsAnim)}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Viewing now
                </div>
              </div>
            </div>
          </div>

          {/* Purchases */}
          <div className="group/card relative overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 via-background/80 to-background p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_8px_24px_-8px_hsl(var(--accent)/0.5)]">
            <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-accent/20 blur-2xl" />
            <div className="relative flex items-start gap-2.5">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/70 text-accent-foreground shadow-[0_4px_20px_-4px_hsl(var(--accent)/0.6)]">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 rounded-full bg-success px-1 py-px text-[8px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                  ✓
                </span>
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-2xl font-extrabold tabular-nums bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent">
                  {loading ? '—' : formatCount(purchasesAnim)}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Bought this
                </div>
              </div>
            </div>
          </div>
        </div>

        {trending && (
          <div className="relative mt-3 overflow-hidden rounded-lg bg-gradient-to-r from-primary/15 via-accent/15 to-primary/15 px-3 py-2">
            <div
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent"
              style={{ animation: 'statsShimmer 2.4s ease-in-out infinite' }}
            />
            <div className="relative flex items-center justify-center gap-2 text-xs font-bold">
              <Flame className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Trending now
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes statsSpin { to { --a: 360deg; } }
        @property --a { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes statsShimmer { 0% { transform: translateX(-100%); } 60%,100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};

export default ProductStatsCard;
