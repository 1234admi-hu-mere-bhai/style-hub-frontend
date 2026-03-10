import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useWebPush } from '@/hooks/useWebPush';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const PushNotificationPrompt = () => {
  const { user } = useAuth();
  const { supported, isSubscribed, permission, subscribe, loading } = useWebPush();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || !supported || isSubscribed || permission === 'denied' || dismissed) {
      setShow(false);
      return;
    }

    // Check if user has dismissed before
    const dismissedAt = localStorage.getItem('push-prompt-dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setShow(false);
        return;
      }
    }

    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [user, supported, isSubscribed, permission, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem('push-prompt-dismissed', Date.now().toString());
  };

  const handleEnable = async () => {
    await subscribe();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-6 sm:w-80 z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10 shrink-0">
            <Bell size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Enable Notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get alerts for flash sales, order updates & exclusive offers
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleEnable} disabled={loading} className="text-xs h-8">
                {loading ? 'Enabling...' : 'Enable'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs h-8">
                Not now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
