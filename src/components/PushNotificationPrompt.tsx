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

    // Always auto-subscribe on every login/visit. Users who want to stop
    // notifications must toggle off in Settings (which calls unsubscribe()
    // for the current session) or block them in browser settings.
    const timer = setTimeout(() => {
      attempted.current = true;
      subscribe();
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, supported, isSubscribed, permission, loading, subscribe]);

  return null;
};

export default PushNotificationPrompt;
