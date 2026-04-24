import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CATEGORIES: { key: PrefKey; label: string; desc: string }[] = [
  { key: 'orders', label: 'Order updates', desc: 'Placed, shipped, out for delivery, delivered, returns & refunds' },
  { key: 'offers', label: 'Offers & discounts', desc: 'New coupons and special promos' },
  { key: 'wishlist', label: 'Wishlist alerts', desc: 'Price drops & back-in-stock on items you love' },
  { key: 'cart_reminders', label: 'Cart reminders', desc: 'Gentle nudge if you leave items in cart' },
  { key: 'flash_sales', label: 'Flash sales', desc: 'Live time-limited deals' },
  { key: 'new_arrivals', label: 'New arrivals', desc: 'Fresh drops we think you will love' },
  { key: 'announcements', label: 'Announcements', desc: 'Brand news and important updates' },
];

type PrefKey = 'orders' | 'offers' | 'wishlist' | 'cart_reminders' | 'flash_sales' | 'new_arrivals' | 'announcements';
type Prefs = Record<PrefKey, boolean>;
const DEFAULTS: Prefs = {
  orders: true, offers: true, wishlist: true, cart_reminders: true,
  flash_sales: true, new_arrivals: true, announcements: true,
};

const NotificationPreferences = () => {
  const { user } = useAuth();
  const { supported, isSubscribed, permission, subscribe, unsubscribe, loading: pushLoading } = useWebPush();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          orders: data.orders, offers: data.offers, wishlist: data.wishlist,
          cart_reminders: data.cart_reminders, flash_sales: data.flash_sales,
          new_arrivals: data.new_arrivals, announcements: data.announcements,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const updatePref = async (key: PrefKey, value: boolean) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...next }, { onConflict: 'user_id' });
    if (error) {
      toast.error('Could not save preference');
      setPrefs(prefs);
    }
  };

  if (!supported) return null;

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h2 className="font-semibold text-xl mb-1 flex items-center gap-2">
        <Bell size={20} />
        Push Notifications
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Get instant updates on your phone or laptop screen.
      </p>

      {/* Master toggle */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-border">
        <div>
          <Label htmlFor="push-master" className="text-base">
            {permission === 'denied' ? 'Notifications Blocked' : 'Enable on this device'}
          </Label>
          <p className="text-sm text-muted-foreground">
            {permission === 'denied'
              ? 'Please enable notifications in your browser settings'
              : isSubscribed
                ? 'You will receive alerts on this device'
                : 'Turn on to start receiving alerts'}
          </p>
        </div>
        <Switch
          id="push-master"
          checked={isSubscribed}
          disabled={pushLoading || permission === 'denied'}
          onCheckedChange={(checked) => {
            if (checked) {
              localStorage.removeItem('push-notifications-off');
              subscribe();
            } else {
              localStorage.setItem('push-notifications-off', 'true');
              unsubscribe();
            }
          }}
        />
      </div>

      {/* Per-category */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor={`pref-${key}`} className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                id={`pref-${key}`}
                checked={prefs[key]}
                disabled={!isSubscribed}
                onCheckedChange={(v) => updatePref(key, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPreferences;
