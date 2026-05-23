import { useEffect, useState } from 'react';
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

const SplashScreen = () => {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!isStandalonePWA()) return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem(SPLASH_KEY, '1');
    const fadeT = setTimeout(() => setLeaving(true), 1600);
    const hideT = setTimeout(() => setShow(false), 2100);
    return () => {
      clearTimeout(fadeT);
      clearTimeout(hideT);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#1a0d3d' }}
      aria-hidden="true"
    >
      <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-white flex items-center justify-center shadow-2xl splash-bloom">
        <img
          src={logoGold}
          alt="MUFFIGOUT APPAREL HUB"
          className="w-[78%] h-[78%] object-contain"
        />
      </div>

      <style>{`
        @keyframes splashBloom {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .splash-bloom { animation: splashBloom 700ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
