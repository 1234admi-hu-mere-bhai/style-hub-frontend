import { useState } from 'react';
import { ChevronRight, Tag } from 'lucide-react';
import { useActiveBankOffers, bestOfferFor, computeBankDiscount, type BankOffer } from '@/hooks/useBankOffers';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  basePrice: number;
  /** Optional preview override (used by the admin live preview) */
  previewOffer?: BankOffer;
}

export const MegaDealBadge = ({ text }: { text: string }) => (
  <span className="flex-shrink-0 inline-flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent px-3 py-1.5 leading-[1.05] shadow-sm">
    {text.split(' ').slice(0, 2).map((w, i) => (
      <span key={i} className="text-[9px] font-extrabold uppercase tracking-tight text-primary-foreground">
        {w}
      </span>
    ))}
  </span>
);

const BankOffersCard = ({ basePrice, previewOffer }: Props) => {
  const { offers, loading } = useActiveBankOffers();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);

  const list = previewOffer ? [previewOffer] : offers;
  if (!previewOffer && loading) return null;
  if (list.length === 0) return null;

  const best = bestOfferFor(list, basePrice);
  if (!best) return null;

  const finalPrice = Math.max(0, basePrice - best.discount);
  const badgeText = best.offer.badge_text?.trim() || 'MEGA DEAL';
  const footerText = best.offer.footer_text?.trim() || 'With Bank Offer';

  return (
    <div className="rounded-2xl border border-border bg-secondary/30 overflow-hidden">
      {/* Top row: badge + get-at price + extra off pill */}
      <div className="flex items-center gap-3 px-3 py-3">
        <MegaDealBadge text={badgeText} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-foreground leading-tight">
            Get at {formatPrice(finalPrice)}
          </p>
          <span className="mt-0.5 block h-[3px] w-10 rounded-full bg-accent" />
        </div>
        <span className="flex-shrink-0 rounded-lg bg-success px-3 py-2 text-xs font-bold text-success-foreground">
          Extra {formatPrice(best.discount)} Off
        </span>
      </div>

      {/* Bottom bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 border-t border-border bg-card hover:bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm text-foreground">
          <Tag size={14} className="text-primary" />
          {footerText}
        </span>
        <span className="flex items-center gap-0.5 text-sm font-semibold text-primary">
          Details
          <ChevronRight size={15} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-2 space-y-2 bg-card border-t border-border">
          {list.map((o) => {
            const disc = computeBankDiscount(o, basePrice);
            const eligible = disc > 0;
            return (
              <div
                key={o.id}
                className={`rounded-xl border p-3 ${
                  eligible ? 'border-border bg-secondary/30' : 'border-dashed border-border/60 bg-muted/30'
                }`}
              >
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
                  <p className="text-[11px] text-muted-foreground mt-1">On: {o.banks.join(', ')}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                  {o.min_order > 0 && (
                    <span className="text-muted-foreground">Min order {formatPrice(Number(o.min_order))}</span>
                  )}
                  {o.applies_to !== 'all' && (
                    <span className="text-muted-foreground uppercase tracking-wider">{o.applies_to} only</span>
                  )}
                  {eligible ? (
                    <span className="text-success font-medium">You save {formatPrice(disc)}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Not applicable on this item</span>
                  )}
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
