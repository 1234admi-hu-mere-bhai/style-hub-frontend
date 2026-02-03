import { useState } from 'react';
import { Star, ThumbsUp, Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  images?: string[];
  verified: boolean;
}

interface ReviewSectionProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

const ReviewSection = ({ productId, reviews, averageRating, totalReviews }: ReviewSectionProps) => {
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((r) => Math.floor(r.rating) === rating).length;
    return {
      rating,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    };
  });

  const handleSubmitReview = () => {
    if (!newReview.title.trim() || !newReview.comment.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Review submitted! (Demo - will appear after moderation)');
    setShowWriteReview(false);
    setNewReview({ rating: 5, title: '', comment: '' });
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
                  <Star
                    key={i}
                    size={20}
                    className={
                      i < Math.floor(averageRating)
                        ? 'fill-gold text-gold'
                        : 'text-border'
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {totalReviews} reviews
              </p>
            </div>
          </div>
          <Button onClick={() => setShowWriteReview(!showWriteReview)}>
            Write a Review
          </Button>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <span className="text-sm w-8">{item.rating} ★</span>
              <Progress value={item.percentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground w-8">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      {showWriteReview && (
        <div className="bg-secondary/30 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold">Write Your Review</h3>
          
          {/* Rating Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="p-1"
                >
                  <Star
                    size={24}
                    className={
                      star <= newReview.rating
                        ? 'fill-gold text-gold'
                        : 'text-border hover:text-gold transition-colors'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Review Title</label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              placeholder="Sum up your experience in a few words"
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Review</label>
            <Textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Share your experience with this product..."
              rows={4}
              maxLength={1000}
            />
          </div>

          {/* Add Photos */}
          <div>
            <label className="text-sm font-medium mb-2 block">Add Photos (Optional)</label>
            <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-md text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Camera size={18} />
              Upload Photos
            </button>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSubmitReview}>Submit Review</Button>
            <Button variant="outline" onClick={() => setShowWriteReview(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review!</p>
            <Button variant="outline" onClick={() => setShowWriteReview(true)}>
              Write a Review
            </Button>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  {review.userAvatar ? (
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.userName}</span>
                    {review.verified && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < review.rating ? 'fill-gold text-gold' : 'text-border'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h4 className="font-medium mb-1">{review.title}</h4>
                  <p className="text-muted-foreground text-sm">{review.comment}</p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Review photo ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleHelpful(review.id)}
                    className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ThumbsUp size={14} />
                    Helpful ({review.helpful})
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
