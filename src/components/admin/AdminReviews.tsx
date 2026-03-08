import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Trash2, Eye, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReviewRow {
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
  product_name?: string;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = (data || []) as unknown as ReviewRow[];

      // Fetch product names
      const productIds = [...new Set(reviewsData.map(r => r.product_id))];
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        const productMap = new Map((products || []).map(p => [p.id, p.name]));
        reviewsData.forEach(r => {
          r.product_name = productMap.get(r.product_id) || 'Unknown Product';
        });
      }

      setReviews(reviewsData);
    } catch (err: any) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const { error } = await supabase.functions.invoke('admin-crud', {
        body: { action: 'delete', table: 'reviews', id },
      });
      if (error) throw error;
      toast.success('Review deleted');
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleToggleVerified = async (review: ReviewRow) => {
    try {
      const { error } = await supabase.functions.invoke('admin-crud', {
        body: { action: 'update', table: 'reviews', id: review.id, data: { verified: !review.verified } },
      });
      if (error) throw error;
      toast.success(review.verified ? 'Removed verification' : 'Marked as verified');
      fetchReviews();
    } catch {
      toast.error('Failed to update review');
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = !searchQuery ||
      r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.product_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === null || r.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rv => rv.rating === r).length,
  }));

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Reviews</p>
          <p className="text-2xl font-bold">{reviews.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{avgRating}</p>
            <Star className="h-5 w-5 fill-gold text-gold" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Verified</p>
          <p className="text-2xl font-bold">{reviews.filter(r => r.verified).length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">5-Star Reviews</p>
          <p className="text-2xl font-bold">{reviews.filter(r => r.rating === 5).length}</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">Rating Distribution</h3>
        <div className="space-y-2">
          {ratingCounts.map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-3">
              <button
                onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                className={`text-sm w-10 text-right hover:text-primary ${ratingFilter === rating ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                {rating} ★
              </button>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all"
                  style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews by user, title, product..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {ratingFilter !== null && (
          <Button variant="outline" size="sm" onClick={() => setRatingFilter(null)}>
            <Filter className="h-3.5 w-3.5 mr-1" /> Clear filter ({ratingFilter}★)
          </Button>
        )}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {reviews.length === 0 ? 'No reviews yet.' : 'No reviews match your filters.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map(review => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{review.user_name}</span>
                    {review.verified && (
                      <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">Verified</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'fill-gold text-gold' : 'text-border'} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mb-0.5">Product: <span className="text-foreground">{review.product_name}</span></p>
                  <h4 className="font-medium text-sm">{review.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.images.map((img, idx) => (
                        <img key={idx} src={img} alt="" className="w-12 h-12 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVerified(review)}
                    className="text-xs"
                  >
                    {review.verified ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                    className="text-destructive hover:text-destructive text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
