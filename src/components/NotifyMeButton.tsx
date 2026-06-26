import { useEffect, useState } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface NotifyMeButtonProps {
  productId: string;
  productName: string;
}

const NotifyMeButton = ({ productId, productName }: NotifyMeButtonProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setChecking(false); return; }
      const { data } = await supabase
        .from('stock_notifications' as any)
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .is('notified_at', null)
        .maybeSingle();
      if (active) {
        setEnrolled(!!data);
        setChecking(false);
      }
    })();
    return () => { active = false; };
  }, [productId]);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to get notified');
        navigate('/auth');
        return;
      }

      if (enrolled) {
        await supabase
          .from('stock_notifications' as any)
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id);
        setEnrolled(false);
        toast.success('Alert removed');
        return;
      }

      const { error } = await supabase
        .from('stock_notifications' as any)
        .insert({ product_id: productId, user_id: user.id, email: user.email });
      if (error) throw error;

      setEnrolled(true);

      // Request push permission so users actually receive the alert
      if ('Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch {}
      }

      toast.success("You'll be notified when it's back!", {
        description: `We'll alert you the moment ${productName} is available again.`,
      });
    } catch (e: any) {
      toast.error(e?.message || 'Could not enroll for alerts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      className={`flex-1 transition-all ${enrolled ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}`}
      onClick={handleClick}
      disabled={loading || checking}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : enrolled ? (
        <BellRing className="w-4 h-4 mr-2" />
      ) : (
        <Bell className="w-4 h-4 mr-2" />
      )}
      {enrolled ? "We'll notify you" : 'Notify Me When Available'}
    </Button>
  );
};

export default NotifyMeButton;
