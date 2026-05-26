import { useEffect, useState } from 'react';
import { Loader2, Wallet as WalletIcon, CreditCard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReturnRow {
  id: string;
  status: string;
  allowed_refund_methods: string[];
  selected_refund_method: string | null;
  admin_window_expires_at: string | null;
}

interface Props {
  orderId: string;
  orderStatus: string;
  onSelected?: () => void;
}

const labelFor = (m: string) =>
  m === 'wallet' ? 'Instant credit to Wallet' : 'Refund to original payment source';

export const RefundMethodPicker = ({ orderId, orderStatus, onSelected }: Props) => {
  const [ret, setRet] = useState<ReturnRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('returns')
        .select('id, status, allowed_refund_methods, selected_refund_method, admin_window_expires_at')
        .eq('order_id', orderId)
        .maybeSingle();
      if (!cancelled) {
        setRet((data as ReturnRow | null) || null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [orderId, orderStatus]);

  if (loading || !ret || orderStatus !== 'return_approved') return null;
  if (ret.selected_refund_method) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-3 text-sm">
        Refund method: <span className="font-semibold">{labelFor(ret.selected_refund_method)}</span>
      </div>
    );
  }
  const allowed = (ret.allowed_refund_methods || []) as string[];
  if (allowed.length < 2) return null; // nothing to choose

  const expiresAt = ret.admin_window_expires_at ? new Date(ret.admin_window_expires_at).getTime() : 0;
  const remainingMs = Math.max(0, expiresAt - now);
  const expired = expiresAt > 0 && remainingMs <= 0;
  const hh = Math.floor(remainingMs / 3600000);
  const mm = Math.floor((remainingMs % 3600000) / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);

  const pick = async (method: 'wallet' | 'source') => {
    setSubmitting(method);
    try {
      const { data, error } = await supabase.functions.invoke('select-refund-method', {
        body: { orderId, method },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Failed');
      toast.success('Refund method saved');
      setRet({ ...ret, selected_refund_method: method });
      onSelected?.();
    } catch (e: any) {
      toast.error(e.message || 'Could not save selection');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1">
          <p className="font-semibold text-sm">Choose how you'd like your refund</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {expired
              ? 'Selection window closed — refund will go to your original payment source.'
              : 'After this window closes, refund will go to your original payment source.'}
          </p>
        </div>
        {!expired && expiresAt > 0 && (
          <div className="flex items-center gap-1 text-xs text-accent font-mono">
            <Clock size={12} />
            {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {allowed.includes('wallet') && (
          <Button
            variant="outline"
            disabled={expired || !!submitting}
            onClick={() => pick('wallet')}
            className="h-auto py-3 justify-start"
          >
            {submitting === 'wallet' ? <Loader2 size={16} className="animate-spin mr-2" /> : <WalletIcon size={16} className="mr-2 text-primary" />}
            <div className="text-left">
              <p className="font-semibold text-sm">Instant to Wallet</p>
              <p className="text-[11px] text-muted-foreground">Use it immediately on your next order</p>
            </div>
          </Button>
        )}
        {allowed.includes('source') && (
          <Button
            variant="outline"
            disabled={expired || !!submitting}
            onClick={() => pick('source')}
            className="h-auto py-3 justify-start"
          >
            {submitting === 'source' ? <Loader2 size={16} className="animate-spin mr-2" /> : <CreditCard size={16} className="mr-2 text-primary" />}
            <div className="text-left">
              <p className="font-semibold text-sm">Original payment source</p>
              <p className="text-[11px] text-muted-foreground">5–7 business days to reflect</p>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
};

export default RefundMethodPicker;
