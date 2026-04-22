import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
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

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApply = (code: string) => {
    navigate(`/checkout?coupon=${encodeURIComponent(code)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-serif text-lg font-bold leading-tight">Coupons & Offers</h1>
            <p className="text-xs text-muted-foreground">Tap Apply to use at checkout</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No active coupons right now.</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon for new offers!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => {
              const expiresSoon = c.expires_at && new Date(c.expires_at) > new Date();
              return (
                <div
                  key={c.id}
                  className="border-2 border-border rounded-2xl overflow-hidden bg-card hover:border-primary/40 transition-colors"
                >
                  <div className="flex">
                    {/* Discount badge column */}
                    <div className="w-20 bg-primary/10 flex items-center justify-center shrink-0 border-r-2 border-dashed border-border">
                      <span className="text-xs font-bold text-primary -rotate-90 whitespace-nowrap tracking-wide">
                        {c.discount_type === 'percentage'
                          ? `${c.discount_value}% OFF`
                          : `₹${c.discount_value} OFF`}
                      </span>
                    </div>

                    {/* Details column */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => handleCopy(c.code)}
                            className="flex items-center gap-1.5 group"
                            aria-label={`Copy code ${c.code}`}
                          >
                            <span className="font-mono font-bold text-base">{c.code}</span>
                            {copiedCode === c.code ? (
                              <Check size={14} className="text-success" />
                            ) : (
                              <Copy size={13} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            )}
                          </button>
                          <p className="text-sm text-muted-foreground mt-1.5">
                            {c.discount_type === 'percentage'
                              ? `Flat ${c.discount_value}% off`
                              : `Flat ₹${c.discount_value} off`}
                            {c.min_order_value && c.min_order_value > 0
                              ? ` on orders above ₹${c.min_order_value}`
                              : ''}
                          </p>
                          {expiresSoon && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Valid till {new Date(c.expires_at!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleApply(c.code)}
                          className="shrink-0 rounded-full px-4"
                        >
                          APPLY
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <p className="text-xs text-muted-foreground text-center pt-4 px-4">
              Only one coupon can be applied per order. Coupons cannot be combined with Flash Sale items.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Coupons;
