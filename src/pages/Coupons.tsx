import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BadgePercent, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

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

  const formatDiscount = (c: Coupon) =>
    c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`;

  const describe = (c: Coupon) => {
    const base =
      c.discount_type === 'percentage'
        ? `Flat ${c.discount_value}% discount applied to your order.`
        : `Flat ₹${c.discount_value} discount applied to your order.`;
    const min =
      c.min_order_value && c.min_order_value > 0
        ? ` Valid on orders above ₹${c.min_order_value}.`
        : '';
    return base + min;
  };

  const best = coupons[0];
  const others = coupons.slice(1);

  const renderCard = (c: Coupon) => {
    const isApplied = appliedCode === c.code;
    return (
      <div
        key={c.id}
        className={`rounded-2xl border bg-card p-4 transition-colors ${
          isApplied ? 'border-success/50 bg-success/5' : 'border-border'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              isApplied ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'
            }`}
          >
            <BadgePercent size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="font-bold text-base leading-tight">{formatDiscount(c)}</h3>
              <span className="font-mono text-xs text-muted-foreground">· {c.code}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">{describe(c)}</p>
            {c.expires_at && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Valid till{' '}
                {new Date(c.expires_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          {isApplied ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(c.code)}
              className="shrink-0 font-bold text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              REMOVE
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goApply(c.code)}
              className="shrink-0 font-bold text-primary hover:text-primary hover:bg-primary/10"
            >
              Apply
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3 max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-serif text-lg font-bold">Save more with coupons</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl">
        {/* Manual code entry bar */}
        <section className="bg-background px-4 py-4 border-b border-border">
          <div className="flex items-center rounded-2xl border-2 border-dashed border-border bg-background overflow-hidden">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="h-12 flex-1 border-0 bg-transparent rounded-none px-4 focus-visible:ring-0 focus-visible:border-0 uppercase tracking-wider"
              onKeyDown={(e) => {
                if (e.key === 'Enter') goApply(manualCode);
              }}
            />
            <button
              onClick={() => goApply(manualCode)}
              className="px-4 h-12 font-bold text-sm text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
            >
              Add Coupon
            </button>
          </div>
        </section>

        {/* Coupon list */}
        {loading ? (
          <div className="flex justify-center py-16">
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
                <h2 className="font-bold text-sm mb-3">Best coupon for you</h2>
                {renderCard(best)}
              </section>
            )}

            {others.length > 0 && (
              <section className="px-4 pt-5 pb-6">
                <h2 className="font-bold text-sm mb-3">Available coupons</h2>
                <div className="space-y-3">{others.map(renderCard)}</div>
              </section>
            )}

            <p className="text-xs text-muted-foreground text-center pb-8 px-4">
              Only one coupon can be applied per order. Coupons cannot be combined with Flash Sale items.
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default Coupons;
