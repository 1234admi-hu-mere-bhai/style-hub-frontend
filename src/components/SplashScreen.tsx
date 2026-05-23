import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logoGold from '@/assets/logo-3d-gold.png';

const SPLASH_KEY = 'muffigout_splash_shown';

const SplashScreen = () => {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });
  const [leaving, setLeaving] = useState(false);
  const [offer, setOffer] = useState<string | null>(null);
  const [latestProduct, setLatestProduct] = useState<{ name: string; image: string } | null>(null);

  // Fetch active flash sale + latest product dynamically
  useEffect(() => {
    if (!show) return;
    (async () => {
      try {
        const nowIso = new Date().toISOString();
        const [saleRes, prodRes] = await Promise.all([
          supabase
            .from('flash_sales' as any)
            .select('title, discount_percentage')
            .eq('is_active', true)
            .gt('end_time', nowIso)
            .lte('start_time', nowIso)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('products')
            .select('name, image, in_stock')
            .eq('in_stock', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (saleRes.data) {
          const d: any = saleRes.data;
          setOffer(`${d.discount_percentage}% OFF • ${d.title}`);
        } else {
          setOffer('MUFFIGOUT20 • 20% OFF on Men\'s Collection');
        }

        if (prodRes.data) {
          const p: any = prodRes.data;
          setLatestProduct({ name: p.name, image: p.image });
        }
      } catch {
        setOffer('MUFFIGOUT20 • 20% OFF on Men\'s Collection');
      }
    })();
  }, [show]);


  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem(SPLASH_KEY, '1');
    const fadeT = setTimeout(() => setLeaving(true), 2200);
    const hideT = setTimeout(() => setShow(false), 2800);
    return () => {
      clearTimeout(fadeT);
      clearTimeout(hideT);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 45%, hsl(174 72% 35% / 0.35) 0%, hsl(262 60% 18%) 45%, hsl(262 65% 10%) 100%)',
      }}
      aria-hidden="true"
    >
      {/* Soft gold halo behind logo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] w-[420px] h-[420px] rounded-full splash-pulse"
        style={{
          background:
            'radial-gradient(circle, hsl(43 90% 60% / 0.35) 0%, transparent 65%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Logo */}
      <div className="relative z-10 splash-bloom">
        <img
          src={logoGold}
          alt="MUFFIGOUT APPAREL HUB"
          className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-[0_8px_24px_rgba(212,165,68,0.45)]"
        />
      </div>

      {/* Wordmark */}
      <div className="relative z-10 mt-6 text-center splash-fade-up">
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-[0.18em] text-[#f5d97e]"
          style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}
        >
          MUFFIGOUT
        </h1>
        <p
          className="mt-1 text-[11px] sm:text-xs font-semibold tracking-[0.4em] uppercase text-white/70"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          Apparel Hub
        </p>
      </div>

      {/* Slogan — slightly larger per request */}
      <p
        className="relative z-10 mt-7 text-base sm:text-lg font-medium tracking-wide text-white/90 px-6 text-center splash-fade-up-delay"
        style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
      >
        Crafted with Trust <span className="text-[#f5d97e] mx-1">•</span> Worn with Pride
      </p>

      {/* Latest drop + offer chip stack */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2.5">
        {latestProduct && (
          <div className="splash-fade-up-delay-2 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 shadow-lg max-w-[85vw]">
            <img
              src={latestProduct.image}
              alt={latestProduct.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-[#f5d97e]/60"
            />
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#f5d97e] shrink-0">
              Just Dropped
            </span>
            <span className="text-xs sm:text-sm text-white/90 truncate max-w-[55vw] sm:max-w-[280px]">
              {latestProduct.name}
            </span>
          </div>
        )}
        {offer && (
          <div className="splash-fade-up-delay-2">
            <div
              className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide text-[#2a1a4a] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #f5d97e 0%, #d4a544 100%)',
                boxShadow: '0 6px 20px rgba(212,165,68,0.4)',
              }}
            >
              {offer}
            </div>
          </div>
        )}
      </div>


      <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: translate(-50%, -58%) scale(1); opacity: 0.85; }
          50% { transform: translate(-50%, -58%) scale(1.12); opacity: 1; }
        }
        @keyframes splashBloom {
          0% { transform: scale(0.55); opacity: 0; filter: blur(8px); }
          60% { transform: scale(1.06); opacity: 1; filter: blur(0); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .splash-pulse { animation: splashPulse 2.2s ease-in-out infinite; }
        .splash-bloom { animation: splashBloom 900ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .splash-fade-up { animation: splashFadeUp 700ms ease-out 600ms both; }
        .splash-fade-up-delay { animation: splashFadeUp 700ms ease-out 900ms both; }
        .splash-fade-up-delay-2 { animation: splashFadeUp 700ms ease-out 1200ms both; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
