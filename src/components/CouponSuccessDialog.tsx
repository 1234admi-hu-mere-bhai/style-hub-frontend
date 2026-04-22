import { useMemo } from 'react';
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

const CONFETTI_COLORS = [
  'hsl(250 85% 60%)',  // primary purple
  'hsl(170 80% 45%)',  // teal accent
  'hsl(42 85% 55%)',   // gold
  'hsl(155 70% 42%)',  // success
  'hsl(300 70% 55%)',  // pink-purple
];

const CouponSuccessDialog = ({
  open,
  onClose,
  code,
  savedAmount,
  note,
}: CouponSuccessDialogProps) => {
  const { formatPrice } = useCurrency();

  // Generate confetti particles once per open
  const particles = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => {
      const angle = (i / 32) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = 80 + Math.random() * 120;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - 40; // bias upward
      return {
        id: i,
        tx: `${tx.toFixed(0)}px`,
        ty: `${ty.toFixed(0)}px`,
        rotate: `${Math.floor(Math.random() * 720 - 360)}deg`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${Math.random() * 120}ms`,
        duration: `${800 + Math.random() * 400}ms`,
        size: 5 + Math.random() * 4,
        ratio: 1.4 + Math.random() * 0.8,
      };
    });
  }, [open, code]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl border border-border/50 p-0 bg-card overflow-visible shadow-[var(--shadow-elevated)] coupon-success-pop">
        {/* Confetti layer (clipped within visual viewport but allowed to overflow modal) */}
        <div className="pointer-events-none absolute left-1/2 -top-9 -translate-x-1/2 z-20" aria-hidden>
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute top-0 left-0 block rounded-[2px] confetti-piece"
              style={{
                width: `${p.size}px`,
                height: `${p.size * p.ratio}px`,
                backgroundColor: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
                ['--tx' as any]: p.tx,
                ['--ty' as any]: p.ty,
                ['--rot' as any]: p.rotate,
              }}
            />
          ))}
        </div>

        {/* Floating badge with brand gradient */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-9 z-10">
          <div className="relative h-[72px] w-[72px] flex items-center justify-center coupon-badge-pop">
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
          <p className="text-sm text-muted-foreground tracking-wide coupon-text-fade" style={{ animationDelay: '250ms' }}>
            ‘<span className="font-semibold text-foreground">{code}</span>’ applied
          </p>
          <h2 className="font-serif text-[26px] leading-tight font-bold mt-2 text-foreground coupon-text-fade" style={{ animationDelay: '320ms' }}>
            {formatPrice(savedAmount)} savings
            <br />
            with this coupon.
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed coupon-text-fade" style={{ animationDelay: '390ms' }}>
            {note || 'Enjoy great offers with every order on Muffigout.'}
          </p>

          <button
            onClick={onClose}
            className="mt-7 w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-[0.2em] text-sm uppercase transition-all shadow-[var(--shadow-glow)] coupon-text-fade"
            style={{ animationDelay: '460ms' }}
          >
            Yay!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponSuccessDialog;
