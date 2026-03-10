import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import { getProductById } from '@/data/products';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Wishlist = () => {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart, setCartOpen } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const handleAddToCart = (item: typeof items[0]) => {
    const product = getProductById(item.id);
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0],
        size: product.sizes[0],
        color: product.colors[0].name,
        quantity: 1,
      });
      toast.success('Added to cart');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold mb-4">
            Your Wishlist is Empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Start adding items you love to your wishlist
          </p>
          <Button asChild>
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">
          My Wishlist ({items.length} items)
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-card rounded-lg overflow-hidden border border-border"
            >
              <Link to={`/product/${item.id}`} className="block">
                <div className="aspect-[3/4] relative overflow-hidden bg-secondary">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/product/${item.id}`}>
                  <h3 className="font-medium mb-1 hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-semibold">
                    {formatPrice(item.price)}
                  </span>
                  {item.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(item.originalPrice)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingBag size={16} className="mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      removeFromWishlist(item.id);
                      toast.success('Removed from wishlist');
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
