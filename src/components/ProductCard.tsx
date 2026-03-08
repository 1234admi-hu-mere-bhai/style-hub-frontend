import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

export interface ProductCardProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string; image?: string }[];
  rating: number;
  reviews: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

interface ProductCardProps {
  product: ProductCardProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const inWishlist = isInWishlist(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0],
      });
      toast.success('Added to wishlist');
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      size: product.sizes[0] || '',
      color: product.colors[0]?.name || '',
      quantity: 1,
    });
    toast.success('Added to cart');
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden bg-secondary rounded-lg aspect-[3/4]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && <span className="badge-new rounded">NEW</span>}
          {product.discount && (
            <span className="badge-sale rounded">-{product.discount}%</span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
            inWishlist
              ? 'bg-primary text-primary-foreground'
              : 'bg-background/80 hover:bg-background'
          }`}
        >
          <Heart size={18} className={inWishlist ? 'fill-current' : ''} />
        </button>

        {/* Quick add overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button
            onClick={handleQuickAdd}
            className="w-full py-3 bg-foreground text-background font-medium text-sm uppercase tracking-wider hover:bg-primary transition-colors rounded flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Quick Add
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {product.reviews > 0 && (
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-gold text-gold" />
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviews})
            </span>
          </div>
        )}

        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-2">
          <span className="font-semibold">₹{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Color swatches */}
        <div className="flex gap-1.5 pt-1">
          {product.colors.slice(0, 4).map((color) => (
            <div
              key={color.name}
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
