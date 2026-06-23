import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Stats = { views: number; purchases: number };

const SESSION_KEY = 'mg_session_id';
const getSessionId = () => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
};

const viewedKey = (pid: string) => `mg_viewed_${pid}`;
const VIEW_DEBOUNCE_MS = 30 * 60 * 1000; // 30 min

export function useProductStats(productId: string | undefined) {
  const [stats, setStats] = useState<Stats>({ views: 0, purchases: 0 });
  const [loading, setLoading] = useState(true);
  const recordedRef = useRef(false);

  // Fetch stats
  const fetchStats = async () => {
    if (!productId) return;
    const { data, error } = await supabase.rpc('get_product_stats', { p_product_id: productId });
    if (!error && data) {
      const d = data as { views?: number; purchases?: number };
      setStats({ views: Number(d.views ?? 0), purchases: Number(d.purchases ?? 0) });
    }
    setLoading(false);
  };

  // Record a view (debounced per session+product)
  useEffect(() => {
    if (!productId || recordedRef.current) return;
    recordedRef.current = true;

    try {
      const last = Number(localStorage.getItem(viewedKey(productId)) || 0);
      if (Date.now() - last < VIEW_DEBOUNCE_MS) return;
      localStorage.setItem(viewedKey(productId), String(Date.now()));
    } catch {}

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('product_views').insert({
        product_id: productId,
        user_id: user?.id ?? null,
        session_id: getSessionId(),
      });
    })();
  }, [productId]);

  // Initial fetch + lightweight polling (realtime removed for privacy — we don't
  // broadcast view rows to clients anymore; instead we refetch the aggregate every 15s).
  useEffect(() => {
    if (!productId) return;
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return { ...stats, loading };
}
