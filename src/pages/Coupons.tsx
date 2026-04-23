import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  expires_at: string | null;
}

const Coupons = () => {
  const navigate = useNavigate();
  const { totalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const refreshApplied = () => {
    try {
      const saved = localStorage.getItem('applied-coupon');
      setAppliedCode(saved ? JSON.parse(saved)?.code ?? null : null);
    } catch {
      setAppliedCode(null);
    }
  };

  useEffect(() => {
    refreshApplied();
    const fetchCoupons = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('coupons')
        .select('id, code, discount_type, discount_value, min_order_value, expires_at')
        .eq('is_active', true)
        .order('discount_value', { ascending: false });
      setCoupons(data || []);
      setLoading(false);
    };
    fetchCoupons();
  }, []);

  const goApply = (code: string) => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    navigate(`/checkout?coupon=${encodeURIComponent(code.trim().toUpperCase())}`);
  };

  const handleRemove = (code: string) => {
    localStorage.removeItem('applied-coupon');
    setAppliedCode(null);
    toast.info(`Coupon "${code}" removed.`);
  };

  // Calculate savings for a coupon based on current cart
  const calcSavings = (c: Coupon) => {
    if (c.discount_type === 'percentage') {
      return Math.round((totalPrice * c.discount_value) / 100);
    }
    return Math.min(c.discount_value, totalPrice);
  };

  const isEligible = (c: Coupon) => totalPrice >= (c.min_order_value || 0);
  const amountNeeded = (c: Coupon) => Math.max(0, (c.min_order_value || 0) - totalPrice);

  const stripLabel = (c: Coupon) =>
    c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`;

  const longDesc = (c: Coupon) => {
    const base =
      c.discount_type === 'percentage'
        ? `Use code ${c.code} & get ${c.discount_value}% off`
        : `Use code ${c.code} & get flat ₹${c.discount_value} off`;
    const min =
      c.min_order_value && c.min_order_value > 0
        ? ` on orders above ₹${c.min_order_value}.`
        : ' on your order.';
    const expiry = c.expires_at
      ? ` Valid till ${new Date(c.expires_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}.`
      : '';
    return base + min + expiry;
  };

  const best = coupons[0];
  const others = coupons.slice(1);

  const renderCard = (c: Coupon, variant: 'best' | 'normal' = 'normal') => {
    const isApplied = appliedCode === c.code;
    const eligible = isEligible(c);
    const savings = calcSavings(c);
    const isOpen = expanded === c.id;

    // Strip color: brand primary for best/eligible, success when applied, muted otherwise
    const stripStyle: React.CSSProperties = isApplied
      ? { background: 'hsl(var(--success))' }
      : variant === 'best' || eligible
      ? { background: 'var(--gradient-warm)' }
      : { background: 'hsl(var(--muted-foreground) / 0.4)' };

    const applyColor = isApplied
      ? 'text-destructive'
      : eligible
      ? 'text-primary'
      : 'text-muted-foreground';

    return (
      <div
        key={c.id}
        className="relative rounded-2xl bg-card overflow-hidden shadow-[var(--shadow-card)] border border-border/50"
      >
        <div className="flex min-h-[140px]">
          {/* Vertical discount strip */}
          <div
            className="w-16 shrink-0 flex items-center justify-center relative"
            style={{
              ...stripStyle,
              maskImage:
                'radial-gradient(circle 6px at right 0%, transparent 99%, black 100%), radial-gradient(circle 6px at right 100%, transparent 99%, black 100%), linear-gradient(black, black)',
              maskComposite: 'intersect',
              WebkitMaskImage:
                'radial-gradient(circle 6px at right 0%, transparent 99%, black 100%), radial-gradient(circle 6px at right 100%, transparent 99%, black 100%), linear-gradient(black, black)',
            }}
          >
            <span className="text-primary-foreground font-extrabold text-base tracking-wider whitespace-nowrap -rotate-90">
              {stripLabel(c)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-lg tracking-wide leading-tight">{c.code}</h3>
                {isApplied ? (
                  <p className="text-success font-semibold text-sm mt-1">
                    Saved {formatPrice(savings)} on this order!
                  </p>
                ) : eligible ? (
                  <p className="text-success font-semibold text-sm mt-1">
                    Save {formatPrice(savings)} on this order!
                  </p>
                ) : (
                  <p className="text-success font-semibold text-sm mt-1">
                    Add ₹{amountNeeded(c)} more to avail this offer
                  </p>
                )}
              </div>
              <button
                onClick={() => (isApplied ? handleRemove(c.code) : goApply(c.code))}
                disabled={!isApplied && !eligible}
                className={`shrink-0 font-extrabold text-sm tracking-wide ${applyColor} disabled:cursor-not-allowed`}
              >
                {isApplied ? 'REMOVE' : 'APPLY'}
              </button>
            </div>

            <div className="border-t border-dashed border-border my-3" />

            <p
              className={`text-xs text-muted-foreground leading-relaxed ${
                isOpen ? '' : 'line-clamp-2'
              }`}
            >
              {longDesc(c)}
            </p>

            <button
              onClick={() => setExpanded(isOpen ? null : c.id)}
              className="text-xs font-bold text-foreground mt-2 self-start hover:underline"
            >
              {isOpen ? '− LESS' : '+ MORE'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ineligibleCount = coupons.filter((c) => !isEligible(c)).length;

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      {/* Header */}
      <header className="bg-background">
        <div className="container mx-auto px-4 pt-4 pb-3 max-w-2xl flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider uppercase leading-tight">
              Apply Coupon
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your cart: {formatPrice(totalPrice)}
            </p>
          </div>
        </div>

        {/* Manual code entry bar */}
        <div className="container mx-auto max-w-2xl px-4 pb-5">
          <div className="flex items-center rounded-2xl border border-border bg-background overflow-hidden h-14">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Enter Coupon Code"
              className="h-full flex-1 border-0 bg-transparent rounded-none px-5 focus-visible:ring-0 focus-visible:border-0 text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter') goApply(manualCode);
              }}
            />
            <button
              onClick={() => goApply(manualCode)}
              className="px-5 h-full font-extrabold text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              APPLY
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl flex-1 pb-24">
        {/* Info banner */}
        {!loading && coupons.length > 0 && ineligibleCount > 0 && (
          <div className="mx-4 mt-4 bg-card rounded-xl px-4 py-3 flex items-start gap-3 shadow-[var(--shadow-card)] border border-border/50">
            <Info size={18} className="text-accent shrink-0 mt-0.5" fill="hsl(var(--accent))" stroke="hsl(var(--accent-foreground))" />
            <p className="text-sm text-foreground leading-snug">
              {ineligibleCount} coupon{ineligibleCount > 1 ? 's are' : ' is'} not eligible for your current cart value.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center min-h-[60vh] py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No active coupons right now.</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon for new offers!</p>
          </div>
        ) : (
          <>
            {best && (
              <section className="px-4 pt-5 pb-2">
                <h2 className="font-bold text-base mb-3">Best coupon</h2>
                {renderCard(best, 'best')}
              </section>
            )}

            {others.length > 0 && (
              <section className="px-4 pt-5 pb-6">
                <h2 className="font-bold text-base mb-3">More offers</h2>
                <div className="space-y-3">{others.map((c) => renderCard(c))}</div>
              </section>
            )}

            <p className="text-xs text-muted-foreground text-center pb-6 px-4">
              Only one coupon can be applied per order. Coupons cannot be combined with Flash Sale items.
            </p>
          </>
        )}
      </main>

      <div className="mt-auto" />
    </div>
  );
};

export default Coupons;
