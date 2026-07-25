import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, BadgePercent, Tag } from 'lucide-react';
import { useActiveBankOffers, bestOfferFor, computeBankDiscount } from '@/hooks/useBankOffers';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  basePrice: number;
}

const BankOffersCard = ({ basePrice }: Props) => {
  const { offers, loading } = useActiveBankOffers();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);

  if (loading || offers.length === 0) return null;

  const best = bestOfferFor(offers, basePrice);
  if (!best) return null;

  const finalPrice = Math.max(0, basePrice - best.discount);

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 overflow-hidden">
      {/* Mega Deal header row */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {best.offer.title}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-success">
          SAVE {formatPrice(best.discount)}
        </span>
      </div>

      {/* Price line */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Get at</p>
          <p className="text-2xl font-bold text-foreground">{formatPrice(finalPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">with Bank Offer</p>
          <p className="text-xs font-medium text-primary">
            Extra {formatPrice(best.discount)} Off
          </p>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-primary/20 text-xs font-semibold hover:bg-primary/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <BadgePercent size={14} className="text-primary" />
          {offers.length} offer{offers.length > 1 ? 's' : ''} available
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          {offers.map((o) => {
            const disc = computeBankDiscount(o, basePrice);
            const eligible = disc > 0;
            return (
              <div
                key={o.id}
                className={`rounded-lg border p-3 ${
                  eligible ? 'border-border bg-card' : 'border-dashed border-border/60 bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Tag size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {o.discount_type === 'percent'
                        ? `${o.discount_value}% off`
                        : `Flat ${formatPrice(Number(o.discount_value))} off`}
                      {o.max_discount ? ` up to ${formatPrice(Number(o.max_discount))}` : ''}
                    </p>
                    {o.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{o.description}</p>
                    )}
                    {o.banks.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        On: {o.banks.join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                      {o.min_order > 0 && (
                        <span className="text-muted-foreground">Min order {formatPrice(Number(o.min_order))}</span>
                      )}
                      {o.applies_to !== 'all' && (
                        <span className="text-muted-foreground uppercase tracking-wider">
                          {o.applies_to} only
                        </span>
                      )}
                      {eligible ? (
                        <span className="text-success font-medium">You save {formatPrice(disc)}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Not applicable on this item</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-muted-foreground italic">
            *Final discount will be applied at checkout by your bank. T&C apply.
          </p>
        </div>
      )}
    </div>
  );
};

export default BankOffersCard;
