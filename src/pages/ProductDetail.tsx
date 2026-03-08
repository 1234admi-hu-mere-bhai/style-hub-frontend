import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, Star, Truck, RefreshCw, Shield, Ruler, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SizeChartModal from '@/components/SizeChartModal';
import ReviewSection from '@/components/ReviewSection';
import { useDbProducts, useDbProduct } from '@/hooks/useDbProducts';
import { getProductReviews } from '@/data/reviews';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading } = useDbProduct(id || '');
  const { products: allProducts } = useDbProducts();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const currentImage = useMemo(() => {
    if (!product) return '';
    if (selectedColor) {
      const colorOption = product.colors.find(c => c.name === selectedColor);
      if (colorOption?.image) return colorOption.image;
    }
    return product.images[0];
  }, [product, selectedColor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Button asChild><Link to="/products">Continue Shopping</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const reviews = getProductReviews(product.id);
  const relatedProducts = allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error('Please select a size'); return; }
    if (!selectedColor) { toast.error('Please select a color'); return; }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    if (!selectedSize || !selectedColor) { toast.error('Please select size and color'); return; }
    handleAddToCart();
    navigate('/checkout');
  };

  const handleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({ id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, image: product.images[0] });
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-foreground capitalize">{product.category}</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="relative">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
              <img src={currentImage} alt={`${product.name}${selectedColor ? ` - ${selectedColor}` : ''}`} className="w-full h-full object-cover transition-all duration-300" />
            </div>
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && <span className="badge-new rounded">NEW</span>}
              {product.discount && <span className="badge-sale rounded">-{product.discount}%</span>}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">{product.name}</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className={i < Math.floor(product.rating) ? 'fill-gold text-gold' : 'text-border'} />
                  ))}
                </div>
                <span className="text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="text-success font-semibold">{product.discount}% OFF</span>
                </>
              )}
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            <div>
              <h3 className="font-semibold mb-3">Color: <span className="font-normal text-muted-foreground">{selectedColor || 'Select a color'}</span></h3>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button key={color.name} onClick={() => setSelectedColor(color.name)} className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border'}`} style={{ backgroundColor: color.hex }} title={color.name} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Size: <span className="font-normal text-muted-foreground">{selectedSize || 'Select a size'}</span></h3>
                <button onClick={() => setSizeChartOpen(true)} className="text-sm text-primary hover:underline flex items-center gap-1"><Ruler size={16} />Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button key={size} onClick={() => setSelectedSize(size)} className={`min-w-[48px] px-4 py-2 border rounded-md font-medium transition-colors ${selectedSize === size ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}>{size}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-md">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"><Minus size={18} /></button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"><Plus size={18} /></button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>Add to Cart</Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={handleBuyNow}>Buy Now</Button>
              <Button size="lg" variant="outline" className="px-4" onClick={handleWishlist}>
                <Heart size={20} className={inWishlist ? 'fill-primary text-primary' : ''} />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center"><Truck className="w-6 h-6 mx-auto mb-2 text-primary" /><p className="text-xs text-muted-foreground">Free Shipping</p></div>
              <div className="text-center"><RefreshCw className="w-6 h-6 mx-auto mb-2 text-primary" /><p className="text-xs text-muted-foreground">7 Day Returns</p></div>
              <div className="text-center"><Shield className="w-6 h-6 mx-auto mb-2 text-primary" /><p className="text-xs text-muted-foreground">Secure Payment</p></div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.reviews})</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="prose prose-neutral max-w-none">
                <p>{product.description}</p>
                <h4>Features</h4>
                <ul>
                  <li>Premium quality fabric</li>
                  <li>Comfortable fit for all-day wear</li>
                  <li>Easy care - machine washable</li>
                  <li>Sustainable and eco-friendly materials</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <ReviewSection productId={product.id} reviews={reviews} averageRating={product.rating} totalReviews={product.reviews} />
            </TabsContent>
            <TabsContent value="shipping" className="mt-6">
              <div className="space-y-4">
                <div><h4 className="font-semibold mb-2">Delivery</h4><p className="text-muted-foreground">Free standard shipping on orders over ₹999. Estimated delivery time: 3-5 business days.</p></div>
                <div><h4 className="font-semibold mb-2">Returns</h4><p className="text-muted-foreground">Easy returns within 7 days of delivery. Items must be unused with original tags attached.</p></div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p) => (<ProductCard key={p.id} product={p} />))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <SizeChartModal open={sizeChartOpen} onOpenChange={setSizeChartOpen} category={product.category} />
    </div>
  );
};

export default ProductDetail;
