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

export const useVisitorTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
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
