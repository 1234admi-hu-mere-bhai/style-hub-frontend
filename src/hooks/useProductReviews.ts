import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  verified: boolean;
  helpful: number;
  created_at: string;
}

export const useProductReviews = (productId: string) => {
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews' as any)
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data as unknown as DbReview[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  const submitReview = async (review: {
    product_id: string;
    user_id: string;
    user_name: string;
    rating: number;
    title: string;
    comment: string;
  }) => {
    const { error } = await supabase
      .from('reviews' as any)
      .insert(review as any);

    if (error) throw error;
    await fetchReviews();
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return { reviews, loading, submitReview, averageRating, totalReviews: reviews.length, refetch: fetchReviews };
};
