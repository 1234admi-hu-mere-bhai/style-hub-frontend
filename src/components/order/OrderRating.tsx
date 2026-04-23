import { useEffect, useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OrderRatingProps {
  productId: string;
  productName: string;
}

const OrderRating = ({ productId, productName }: OrderRatingProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<{ rating: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) {
        if (data) setExisting({ rating: (data as any).rating });
        setLoading(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [productId, user]);

  const submit = async () => {
    if (!user) return toast.error('Please sign in to rate');
    if (rating < 1) return toast.error('Please tap a star to rate');
    setSubmitting(true);
    try {
      const userName =
        (user.user_metadata as any)?.first_name ||
        user.email?.split('@')[0] ||
        'Customer';
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        user_name: userName,
        rating,
        title: rating >= 4 ? 'Loved it' : rating === 3 ? 'It was okay' : 'Could be better',
        comment: comment.trim(),
        verified: true,
      });
      if (error) throw error;
      setExisting({ rating });
      setComment('');
      toast.success(`Rating saved — ${rating} ${rating === 1 ? 'star' : 'stars'}`, {
        description:
          rating >= 4
            ? "We're thrilled you loved it!"
            : rating === 3
              ? 'Thanks for the honest feedback.'
              : "Sorry it wasn't perfect — your feedback helps us improve.",
        duration: 4000,
      });
    } catch (err: any) {
      toast.error(err.message || 'Could not submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <section className="bg-card border-b border-border px-4 py-5">
      <h2 className="font-bold text-base mb-1">Rate your experience</h2>
      <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{productName}</p>

      {existing ? (
        <div
          key={existing.rating}
          className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg px-3 py-3 animate-fade-in"
        >
          <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              Your rating: {existing.rating} / 5
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={
                    s <= existing.rating
                      ? 'fill-gold text-gold'
                      : 'text-muted-foreground/30'
                  }
                />
              ))}
              <span className="text-[11px] text-muted-foreground ml-1">
                Saved
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className="p-1.5 transition-transform active:scale-90"
                aria-label={`Rate ${s} stars`}
              >
                <Star
                  size={32}
                  className={
                    s <= (hover || rating)
                      ? 'fill-gold text-gold drop-shadow-sm'
                      : 'text-muted-foreground/40'
                  }
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div className="space-y-3 mt-2 animate-fade-in">
              <Textarea
                placeholder="Share a few words about the product (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
                className="resize-none"
              />
              <Button
                onClick={submit}
                disabled={submitting}
                className="w-full rounded-full"
              >
                {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                Submit Rating
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default OrderRating;
