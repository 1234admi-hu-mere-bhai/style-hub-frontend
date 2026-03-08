import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const getVisitorId = (): string => {
  let id = localStorage.getItem('visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('visitor_id', id);
  }
  return id;
};

const DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

const shouldTrack = (page: string): boolean => {
  const key = `last_visit_${page}`;
  const last = sessionStorage.getItem(key);
  const now = Date.now();
  if (last && now - Number(last) < DEBOUNCE_MS) {
    return false;
  }
  sessionStorage.setItem(key, String(now));
  return true;
};

export const useVisitorTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Skip tracking for admin pages
    if (location.pathname.startsWith('/admin')) return;

    const trackVisit = async () => {
      if (!shouldTrack(location.pathname)) return;

      const visitorId = getVisitorId();
      await supabase.from('site_visits' as any).insert({
        page: location.pathname,
        visitor_id: visitorId,
        user_agent: navigator.userAgent,
      } as any);
    };

    trackVisit();
  }, [location.pathname]);
};
