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
      <DialogContent
        className="max-w-sm rounded-3xl border-0 p-0 bg-card overflow-visible"
        showCloseButton
      >
        {/* Floating badge */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-10">
          <div className="relative h-16 w-16 flex items-center justify-center">
            {/* Star/badge background using CSS clip-path */}
            <div
              className="absolute inset-0 bg-success rounded-full"
              style={{
                clipPath:
                  'polygon(50% 0%, 61% 12%, 76% 6%, 82% 21%, 98% 24%, 94% 39%, 106% 50%, 94% 61%, 98% 76%, 82% 79%, 76% 94%, 61% 88%, 50% 100%, 39% 88%, 24% 94%, 18% 79%, 2% 76%, 6% 61%, -6% 50%, 6% 39%, 2% 24%, 18% 21%, 24% 6%, 39% 12%)',
              }}
            />
            <BadgePercent
              size={28}
              className="relative text-primary-foreground"
              strokeWidth={2.5}
            />
          </div>
        </div>

        <div className="pt-12 pb-6 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            ‘<span className="font-semibold">{code}</span>’ applied
          </p>
          <h2 className="font-serif text-2xl font-bold mt-2 leading-tight">
            {formatPrice(savedAmount)} savings with this coupon.
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            {note || 'Enjoy great offers with every order on Muffigout!'}
          </p>

          <button
            onClick={onClose}
            className="mt-6 w-full h-12 rounded-full bg-[hsl(18_95%_55%)] hover:bg-[hsl(18_95%_50%)] text-white font-extrabold tracking-wider text-base transition-colors"
          >
            YAY!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponSuccessDialog;
