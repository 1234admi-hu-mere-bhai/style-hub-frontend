import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Detects Supabase's email-verification redirect (hash contains
 * `type=signup` or `type=email_change` along with `access_token`)
 * and shows a celebratory success dialog with confetti.
 */
const fireConfetti = () => {
  const duration = 2500;
  const end = Date.now() + duration;
  const colors = ['#22c55e', '#a855f7', '#14b8a6', '#fbbf24'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Initial centred burst
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.55 },
    colors,
  });
};

const EmailVerificationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const type = params.get('type');
    const hasToken = params.get('access_token');

    // Skip recovery flow — that has its own /reset-password page
    if (!hasToken || (type !== 'signup' && type !== 'email_change')) return;

    setOpen(true);
    // Defer confetti slightly so the dialog mounts first
    setTimeout(fireConfetti, 150);

    // Clean the hash so refreshing doesn't re-trigger
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [location]);

  const handleContinue = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-success/20 blur-xl animate-pulse" />
            <CheckCircle2 className="relative h-20 w-20 text-success" strokeWidth={1.5} />
          </div>
          <DialogTitle className="text-2xl font-bold">Email Verified!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Welcome to <span className="font-semibold text-foreground">Muffigout Apparel Hub</span>.
            Your account is ready — start exploring our latest drops.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleContinue} size="lg" className="w-full mt-2 rounded-full">
          Start Shopping
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationSuccess;
