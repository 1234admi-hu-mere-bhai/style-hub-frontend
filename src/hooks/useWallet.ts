import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  balance_after: number;
  description: string;
  created_at: string;
}

export const TOPUP_PACKS = [
  { amount: 500, bonus: 0 },
  { amount: 1000, bonus: 25 },
  { amount: 2000, bonus: 50 },
  { amount: 5000, bonus: 125 },
];

export const useWallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [w, t] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
      supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);
    setBalance(Number(w.data?.balance ?? 0));
    setTransactions((t.data || []) as WalletTransaction[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { balance, transactions, loading, refresh };
};
