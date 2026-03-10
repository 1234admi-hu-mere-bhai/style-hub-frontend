import { useState, useRef } from 'react';
import { Star, ThumbsUp, Camera, User, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProductReviews, DbReview } from '@/hooks/useProductReviews';
import { supabase } from '@/integrations/supabase/client';

interface ReviewSectionProps {
  productId: string;
}

const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { reviews, loading, submitReview, averageRating, totalReviews } = useProductReviews(productId);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((r) => Math.floor(r.rating) === rating).length;
    return {
      rating,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    };
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (reviewImages.length + files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      toast.error('Each image must be under 5MB');
    }
    setReviewImages(prev => [...prev, ...validFiles]);
    const newUrls = validFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setReviewImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of reviewImages) {
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('review-images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('review-images').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please log in to write a review');
      return;
    }
    if (!newReview.title.trim() || !newReview.comment.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const imageUrls = reviewImages.length > 0 ? await uploadImages() : [];
      await submitReview({
        product_id: productId,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Customer',
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        images: imageUrls,
      });
      toast.success('Review submitted successfully!');
      setShowWriteReview(false);
      setNewReview({ rating: 5, title: '', comment: '' });
      setReviewImages([]);
      setPreviewUrls([]);
    } catch {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = (reviewId: string) => {
    toast.success('Thanks for your feedback!');
  };

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
            <span className="text-5xl font-bold">{averageRating.toFixed(1)}</span>
            <div>
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className={i < Math.floor(averageRating) ? 'fill-gold text-gold' : 'text-border'} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {totalReviews} reviews
              </p>
            </div>
          </div>
          <Button onClick={() => {
            if (!user) { toast.error('Please log in to write a review'); return; }
            setShowWriteReview(!showWriteReview);
          }}>
            Write a Review
          </Button>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <span className="text-sm w-8">{item.rating} ★</span>
              <Progress value={item.percentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground w-8">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      {showWriteReview && (
        <div className="bg-secondary/30 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold">Write Your Review</h3>
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })} className="p-1">
                  <Star size={24} className={star <= newReview.rating ? 'fill-gold text-gold' : 'text-border hover:text-gold transition-colors'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Review Title</label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
               placeholder="Review Title"
               className="w-full px-5 py-2 border border-border rounded-full bg-background"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Your Review</label>
            <Textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Your Review"
              rows={4}
              maxLength={1000}
            />
          </div>
          {/* Photo Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">Add Photos (optional, max 4)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="flex gap-3 flex-wrap items-center">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {reviewImages.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Camera size={20} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : 'Submit Review'}
            </Button>
            <Button variant="outline" onClick={() => { setShowWriteReview(false); setReviewImages([]); setPreviewUrls([]); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review!</p>
            <Button variant="outline" onClick={() => {
              if (!user) { toast.error('Please log in to write a review'); return; }
              setShowWriteReview(true);
            }}>
              Write a Review
            </Button>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User size={20} className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.user_name}</span>
                    {review.verified && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">Verified Purchase</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'fill-gold text-gold' : 'text-border'} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-medium mb-1">{review.title}</h4>
                  <p className="text-muted-foreground text-sm">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, idx) => (
                        <img key={idx} src={img} alt={`Review photo ${idx + 1}`} className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80" />
                      ))}
                    </div>
                  )}
                  <button onClick={() => handleHelpful(review.id)} className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ThumbsUp size={14} /> Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
