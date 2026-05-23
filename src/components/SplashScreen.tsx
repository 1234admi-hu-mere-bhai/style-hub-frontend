import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logoGold from '@/assets/logo-3d-gold.png';

const SPLASH_KEY = 'muffigout_splash_shown';

const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true
  );
};

interface LatestProduct {
  name: string;
  image: string | null;
}

const SplashScreen = () => {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!isStandalonePWA()) return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });
  const [leaving, setLeaving] = useState(false);
  const [offer, setOffer] = useState<string>('Crafted with Trust • Worn with Pride');
  const [latest, setLatest] = useState<LatestProduct | null>(null);

  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem(SPLASH_KEY, '1');

    (async () => {
      try {
        const now = new Date().toISOString();
        const { data: sale } = await supabase
          .from('flash_sales')
          .select('discount_percentage, title')
          .eq('is_active', true)
          .lte('start_time', now)
          .gte('end_time', now)
          .order('discount_percentage', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (sale?.discount_percentage) {
          setOffer(`🔥 Flash Sale • ${sale.discount_percentage}% OFF`);
        }
      } catch {}

      try {
        const { data: prod } = await supabase
          .from('products')
          .select('name, images, stock_quantity')
          .gt('stock_quantity', 0)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (prod) {
          const img = Array.isArray(prod.images) && prod.images.length > 0 ? String(prod.images[0]) : null;
          setLatest({ name: prod.name as string, image: img });
        }
      } catch {}
    })();

    const fadeT = setTimeout(() => setLeaving(true), 2600);
    const hideT = setTimeout(() => setShow(false), 3100);
    return () => {
      clearTimeout(fadeT);
      clearTimeout(hideT);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 45%, #1f4d52 0%, #2a1357 38%, #150826 100%)',
      }}
      aria-hidden="true"
    >
      {/* Gold halo behind logo */}
      <div className="relative flex items-center justify-center splash-bloom">
        <div
          className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full blur-3xl opacity-60"
          style={{
            background:
              'radial-gradient(circle, rgba(212,175,55,0.55) 0%, rgba(212,175,55,0) 70%)',
          }}
        />
        <img
          src={logoGold}
          alt="MUFFIGOUT APPAREL HUB"
          className="relative w-44 h-44 sm:w-52 sm:h-52 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Wordmark */}
      <div className="mt-8 text-center splash-rise">
        <h1
          className="text-white tracking-[0.18em] text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          MUFFIGOUT
        </h1>
        <p
          className="mt-1 text-white/80 tracking-[0.42em] text-[11px] sm:text-xs uppercase"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Apparel Hub
        </p>
      </div>

      {/* Slogan — larger */}
      <p
        className="mt-6 text-center splash-rise-delay"
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 'clamp(15px, 4.2vw, 19px)',
          color: '#f1d77a',
          letterSpacing: '0.04em',
          fontWeight: 500,
        }}
      >
        Crafted with Trust • Worn with Pride
      </p>

      {/* Offer chip */}
      {offer && offer !== 'Crafted with Trust • Worn with Pride' && (
        <div
          className="mt-5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium splash-rise-delay"
          style={{
            background: 'rgba(241, 215, 122, 0.15)',
            border: '1px solid rgba(241, 215, 122, 0.45)',
            color: '#f1d77a',
          }}
        >
          {offer}
        </div>
      )}

      {/* Just Dropped product pill */}
      {latest && (
        <div
          className="mt-4 flex items-center gap-3 px-3 py-2 rounded-full splash-rise-delay-2"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(241, 215, 122, 0.35)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {latest.image && (
            <img
              src={latest.image}
              alt={latest.name}
              className="w-8 h-8 rounded-full object-cover border border-white/20"
            />
          )}
          <span
            className="text-white/90 text-xs sm:text-sm pr-2 max-w-[180px] truncate"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            <span style={{ color: '#f1d77a' }}>Just Dropped · </span>
            {latest.name}
          </span>
        </div>
      )}

      <style>{`
        @keyframes splashBloom {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splashRise {
          0% { transform: translateY(14px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .splash-bloom { animation: splashBloom 900ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .splash-rise { animation: splashRise 600ms ease-out 500ms both; }
        .splash-rise-delay { animation: splashRise 600ms ease-out 800ms both; }
        .splash-rise-delay-2 { animation: splashRise 600ms ease-out 1100ms both; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
