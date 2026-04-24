import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, Tag, Package, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Subscribes to realtime inserts on `notifications` for the current user
 * and surfaces them as on-screen toasts. Works alongside (and independent of)
 * Web Push — useful when the tab is open and the OS-level push doesn't pop.
 */
const ICONS: Record<string, JSX.Element> = {
  sale: <Tag className="h-4 w-4" />,
  order: <Package className="h-4 w-4" />,
  alert: <AlertCircle className="h-4 w-4" />,
  info: <Bell className="h-4 w-4" />,
};

const InAppNotificationListener = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`in-app-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as { id: string; title: string; message: string; type: string };
          toast(n.title, {
            description: n.message,
            icon: ICONS[n.type] || ICONS.info,
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => navigate('/notifications'),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  return null;
};

export default InAppNotificationListener;
