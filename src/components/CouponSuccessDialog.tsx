import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCurrency } from '@/hooks/useCurrency';
import { BadgePercent } from 'lucide-react';

interface CouponSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  code: string;
  savedAmount: number;
  note?: string;
}

const CouponSuccessDialog = ({
  open,
  onClose,
  code,
  savedAmount,
  note,
}: CouponSuccessDialogProps) => {
  const { formatPrice } = useCurrency();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl border border-border/50 p-0 bg-card overflow-visible shadow-[var(--shadow-elevated)]">
        {/* Floating badge with brand gradient */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-9 z-10">
          <div className="relative h-[72px] w-[72px] flex items-center justify-center">
            {/* Star/burst background */}
            <div
              className="absolute inset-0 rounded-full shadow-[var(--shadow-glow)]"
              style={{
                background: 'var(--gradient-warm)',
                clipPath:
                  'polygon(50% 0%, 61% 12%, 76% 6%, 82% 21%, 98% 24%, 94% 39%, 106% 50%, 94% 61%, 98% 76%, 82% 79%, 76% 94%, 61% 88%, 50% 100%, 39% 88%, 24% 94%, 18% 79%, 2% 76%, 6% 61%, -6% 50%, 6% 39%, 2% 24%, 18% 21%, 24% 6%, 39% 12%)',
              }}
            />
            <BadgePercent
              size={30}
              className="relative text-primary-foreground"
              strokeWidth={2.5}
            />
          </div>
        </div>

        <div className="pt-14 pb-7 px-7 text-center">
          <p className="text-sm text-muted-foreground tracking-wide">
            ‘<span className="font-semibold text-foreground">{code}</span>’ applied
          </p>
          <h2 className="font-serif text-[26px] leading-tight font-bold mt-2 text-foreground">
            {formatPrice(savedAmount)} savings
            <br />
            with this coupon.
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            {note || 'Enjoy great offers with every order on Muffigout.'}
          </p>

          <button
            onClick={onClose}
            className="mt-7 w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-[0.2em] text-sm uppercase transition-all shadow-[var(--shadow-glow)]"
          >
            Yay!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponSuccessDialog;
