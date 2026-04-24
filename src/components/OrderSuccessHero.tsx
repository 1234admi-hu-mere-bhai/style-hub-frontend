import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOUND_PREF_KEY = 'muffigout-sound-enabled';

/**
 * Celebratory hero shown atop OrderConfirmation: animated wavy seal-style badge
 * with floating sparkles + brand-tinted gradient. Plays a short cheeky chime
 * once on mount (Mixkit #2018 — royalty-free, commercial use, no attribution).
 * Users can mute via the speaker toggle; preference persists in localStorage.
 */
const OrderSuccessHero = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    if (playedRef.current) return;
    if (!soundOn) return;
    playedRef.current = true;

    const audio = new Audio('/sounds/order-success.mp3');
    audio.volume = 0.45;
    audioRef.current = audio;
    // Autoplay may be blocked in rare cases (iOS Safari w/o gesture chain) — fail silently.
    audio.play().catch(() => {
      playedRef.current = false;
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_PREF_KEY, String(next));
    if (!next && audioRef.current) {
      audioRef.current.pause();
    }
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6 py-12 text-center shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.25)]">
      {/* Mute toggle */}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={soundOn ? 'Mute celebration sound' : 'Enable celebration sound'}
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-background/70 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
      >
        {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

      {/* Floating sparkles */}
      <Sparkle className="left-[18%] top-6 h-3 w-3 text-primary [animation-delay:0.1s]" />
      <Sparkle className="right-[22%] top-10 h-2.5 w-2.5 text-accent [animation-delay:0.4s]" />
      <Sparkle className="left-[28%] bottom-8 h-2 w-2 text-accent [animation-delay:0.7s]" />
      <Sparkle className="right-[18%] bottom-12 h-3 w-3 text-primary [animation-delay:0.25s]" />
      <Sparkle className="left-[8%] top-1/2 h-2 w-2 text-primary/70 [animation-delay:0.55s]" />
      <Sparkle className="right-[10%] top-1/3 h-2.5 w-2.5 text-accent/80 [animation-delay:0.85s]" />

      {/* Wavy seal badge */}
      <div className="relative mx-auto mb-5 h-28 w-28 animate-[heroPop_0.7s_cubic-bezier(0.22,1.4,0.36,1)_both]">
        {/* Outer wavy aura — slow rotation */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full animate-[spin_18s_linear_infinite] text-primary/25"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M50 4l5 6 7-3 3 7 8 0 0 8 7 3-3 7 6 5-6 5 3 7-7 3 0 8-8 0-3 7-7-3-5 6-5-6-7 3-3-7-8 0 0-8-7-3 3-7-6-5 6-5-3-7 7-3 0-8 8 0 3-7 7 3z"
          />
        </svg>
        {/* Mid wavy ring — counter rotation */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] animate-[spin_22s_linear_infinite_reverse] text-accent/35"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M50 6l4 5 6-2 2 6 7 0 0 7 6 2-2 6 5 4-5 4 2 6-6 2 0 7-7 0-2 6-6-2-4 5-4-5-6 2-2-6-7 0 0-7-6-2 2-6-5-4 5-4-2-6 6-2 0-7 7 0 2-6 6 2z"
          />
        </svg>
        {/* Inner solid badge */}
        <div className="absolute inset-5 grid place-items-center rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.5)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-primary-foreground animate-[checkDraw_0.5s_ease-out_0.4s_both]"
            style={{ strokeDasharray: 24, strokeDashoffset: 0 }}
            aria-hidden="true"
          >
            <polyline points="5 12 10 17 19 8" />
          </svg>
        </div>
      </div>

      <h1 className="font-serif text-3xl font-bold tracking-tight animate-[fade-in_0.5s_ease-out_0.5s_both] sm:text-4xl">
        Order Confirmed
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground animate-[fade-in_0.5s_ease-out_0.65s_both] sm:text-base">
        Yay! Your order is on its way. Crafted with trust, packed with pride.
      </p>

      <style>{`
        @keyframes heroPop {
          0%   { opacity: 0; transform: scale(0.4) rotate(-8deg); }
          60%  { opacity: 1; transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes checkDraw {
          0%   { stroke-dashoffset: 24; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes sparkleFloat {
          0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
          40%      { opacity: 1; transform: scale(1) rotate(45deg); }
          60%      { opacity: 1; transform: scale(1) rotate(45deg); }
        }
      `}</style>
    </div>
  );
};

const Sparkle = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={cn(
      'absolute animate-[sparkleFloat_2.4s_ease-in-out_infinite]',
      className,
    )}
  >
    <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
  </svg>
);

export default OrderSuccessHero;
