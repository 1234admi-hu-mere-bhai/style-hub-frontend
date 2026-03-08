import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  referred_email: string | null;
  referred_id: string | null;
  status: string;
  referrer_discount_applied: boolean;
  referred_discount_applied: boolean;
  created_at: string;
  used_at: string | null;
}

export const useReferrals = (userId: string | undefined) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'MUFFI';
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const fetchReferrals = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referrals' as any)
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const refs = data as unknown as Referral[];
        setReferrals(refs);
        // Find existing code or create one
        if (refs.length > 0) {
          setMyCode(refs[0].referral_code);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    if (!userId) return null;
    const code = generateCode();
    try {
      const { error } = await supabase
        .from('referrals' as any)
        .insert({ referrer_id: userId, referral_code: code } as any);
      if (error) throw error;
      setMyCode(code);
      await fetchReferrals();
      return code;
    } catch {
      return null;
    }
  };

  const applyReferralCode = async (code: string, referredUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('referrals' as any)
        .select('*')
        .eq('referral_code', code)
        .eq('status', 'pending')
        .is('referred_id', null);

      if (error || !data || (data as any[]).length === 0) {
        return { success: false, message: 'Invalid or already used referral code' };
      }

      const referral = (data as unknown as Referral[])[0];
      if (referral.referrer_id === referredUserId) {
        return { success: false, message: 'You cannot use your own referral code' };
      }

      const { error: updateError } = await supabase
        .from('referrals' as any)
        .update({
          referred_id: referredUserId,
          status: 'used',
          used_at: new Date().toISOString(),
        } as any)
        .eq('id', referral.id);

      if (updateError) throw updateError;
      return { success: true, message: 'Referral code applied! You get ₹100 off on this order.' };
    } catch {
      return { success: false, message: 'Failed to apply referral code' };
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [userId]);

  const successfulReferrals = referrals.filter(r => r.status === 'used').length;
  const totalEarnings = successfulReferrals * 100;

  return {
    referrals,
    myCode,
    loading,
    createReferralCode,
    applyReferralCode,
    successfulReferrals,
    totalEarnings,
    refetch: fetchReferrals,
  };
};
