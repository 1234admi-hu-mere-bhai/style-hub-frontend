import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Forces every route change to start at the top of the page.
 *
 * - Uses `useLayoutEffect` so the scroll happens BEFORE the browser paints
 *   the new route — prevents the brief "jump to footer" flash some users
 *   see when the previous page was scrolled down.
 * - Disables the browser's automatic scroll restoration (which can fight
 *   with React Router and land users mid-page or at the footer when
 *   navigating between pages of different heights).
 * - Skips when navigating to a hash anchor so in-page anchor links still
 *   work as expected.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    if (hash) return;
    // `auto` (instant) — never smooth — so users don't visually scroll
    // through the entire previous page on navigation.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    // Some mobile browsers ignore window.scrollTo while the document
    // is still settling; reinforce on the next frame.
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
