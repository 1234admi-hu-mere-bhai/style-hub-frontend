import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BankOffer {
  id: string;
  title: string;
  description: string | null;
  banks: string[];
  discount_type: 'percent' | 'flat';
  discount_value: number;
  max_discount: number | null;
  min_order: number;
  applies_to: 'all' | 'prepaid' | 'cod';
  priority: number;
}

export const computeBankDiscount = (offer: BankOffer, basePrice: number): number => {
  if (basePrice < Number(offer.min_order || 0)) return 0;
  let disc = 0;
  if (offer.discount_type === 'percent') {
    disc = Math.floor((basePrice * Number(offer.discount_value)) / 100);
  } else {
    disc = Math.floor(Number(offer.discount_value));
  }
  if (offer.max_discount != null) {
    disc = Math.min(disc, Number(offer.max_discount));
  }
  return Math.max(0, disc);
};

export const useActiveBankOffers = () => {
  const [offers, setOffers] = useState<BankOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('bank_offers' as any)
        .select('*')
        .order('priority', { ascending: false });
      if (!error && data) setOffers(data as unknown as BankOffer[]);
      setLoading(false);
    };
    load();
  }, []);

  return { offers, loading };
};

export const bestOfferFor = (offers: BankOffer[], basePrice: number): { offer: BankOffer; discount: number } | null => {
  let best: { offer: BankOffer; discount: number } | null = null;
  for (const o of offers) {
    const d = computeBankDiscount(o, basePrice);
    if (d > 0 && (!best || d > best.discount)) best = { offer: o, discount: d };
  }
  return best;
};
