import { useEffect, useRef } from 'react';
import { useWebPush } from '@/hooks/useWebPush';
import { useAuth } from '@/contexts/AuthContext';

const PushNotificationPrompt = () => {
  const { user } = useAuth();
  const { supported, isSubscribed, permission, subscribe, loading } = useWebPush();
  const attempted = useRef(false);

  useEffect(() => {
    if (!user || !supported || isSubscribed || loading || attempted.current) return;
    if (permission === 'denied') return;

    // If user explicitly turned off, don't auto-subscribe
    const explicitlyOff = localStorage.getItem('push-notifications-off');
    if (explicitlyOff === 'true') return;

    // Auto-subscribe after a short delay
    const timer = setTimeout(() => {
      attempted.current = true;
      subscribe();
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, supported, isSubscribed, permission, loading, subscribe]);

  return null;
};

export default PushNotificationPrompt;
