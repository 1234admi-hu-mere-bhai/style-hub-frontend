import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, Star, Truck, RefreshCw, Shield, Ruler, Loader2, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SizeChartModal from '@/components/SizeChartModal';
import ReviewSection from '@/components/ReviewSection';
import Product360Viewer from '@/components/Product360Viewer';
import PincodeChecker from '@/components/PincodeChecker';
import { useDbProducts, useDbProduct } from '@/hooks/useDbProducts';
import { useProductReviews } from '@/hooks/useProductReviews';
import { getProductReviews } from '@/data/reviews';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading } = useDbProduct(id || '');
  const { products: allProducts } = useDbProducts();
  const { averageRating, totalReviews } = useProductReviews(id || '');
  const { addToCart, setBuyNowItem, setCartOpen } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  const [selectedSize, setSelectedSize] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const galleryItems = useMemo(() => {
    if (!product) return [];
    const items: Array<
      | { type: 'image'; src: string; alt: string; fit: 'cover' | 'contain'; colorName?: string }
      | { type: 'rotation'; frames: string[] }
    > = [];

    const seen = new Set<string>();
    const push = (src: string, alt: string, fit: 'cover' | 'contain', colorName?: string) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      items.push({ type: 'image', src, alt, fit, colorName });
    };

    product.images.forEach((src, i) => push(src, `${product.name} photo ${i + 1}`, 'cover'));
    product.colors.forEach((c) => {
      if (c.image) push(c.image, `${product.name} in ${c.name}`, 'cover', c.name);
    });
    if (product.mannequinImage) push(product.mannequinImage, `${product.name} on mannequin`, 'contain');
    if (product.humanModelImage) push(product.humanModelImage, `${product.name} on model`, 'contain');
    if (product.rotationFrames && product.rotationFrames.length > 0) {
      items.push({ type: 'rotation', frames: product.rotationFrames });
    }
    return items;
  }, [product]);

  // Scroll to selected color's image
  useEffect(() => {
    if (!selectedColor || !scrollRef.current) return;
    const idx = galleryItems.findIndex((it) => it.type === 'image' && it.colorName === selectedColor);
    if (idx < 0) return;
    const child = scrollRef.current.children[idx] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedColor, galleryItems]);

  // Track active scroll index and sync color swatch
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(idx);
      const item = galleryItems[idx];
      if (item?.type === 'image' && item.colorName && item.colorName !== selectedColor) {
        setSelectedColor(item.colorName);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [galleryItems, selectedColor]);

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
  
  const relatedProducts = allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    if (addedToCart) {
      setCartOpen(true);
      return;
    }
    if (!selectedSize) { toast.error('Please select a size'); return; }
    if (product.colors.length > 0 && !selectedColor) { toast.error('Please select a color'); return; }
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
    setAddedToCart(true);
  };

  const handleBuyNow = () => {
    if (!selectedSize || (product.colors.length > 0 && !selectedColor)) { toast.error('Please select size and color'); return; }
    setBuyNowItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    navigate('/checkout?buyNow=true');
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
        <nav className="flex items-center space-x-1.5 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
          <ChevronRight size={14} />
          <Link to={`/products?category=${product.category}`} className="hover:text-foreground transition-colors capitalize">{product.category}</Link>
          <ChevronRight size={14} />
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="space-y-3">
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scroll-smooth">
              {galleryItems.map((item, index) => (
                <div key={item.type === 'image' ? item.src : `rotation-${index}`} className="relative min-w-full aspect-[3/4] snap-center rounded-lg overflow-hidden bg-secondary">
                  {item.type === 'image' ? (
                    <img
                      src={item.src}
                      alt={item.alt}
                      className={`w-full h-full transition-all duration-300 ${item.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                    />
                  ) : (
                    <Product360Viewer frames={item.frames} className="h-full rounded-lg" />
                  )}
                  {index === 0 && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.isNew && <span className="badge-new rounded">NEW</span>}
                      {product.discount && <span className="badge-sale rounded">-{product.discount}%</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {galleryItems.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {galleryItems.map((item, index) => (
                  <span key={item.type === 'image' ? `dot-${item.src}` : `dot-rotation-${index}`} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/35'}`} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">{product.name}</h1>
              <div className="flex items-center gap-3">
                {totalReviews > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={18} className={i < Math.floor(averageRating) ? 'fill-gold text-gold' : 'text-border'} />
                      ))}
                    </div>
                    <span className="text-muted-foreground">{averageRating.toFixed(1)} ({totalReviews} reviews)</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">No reviews yet</span>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                  <span className="text-success font-semibold">{product.discount}% OFF</span>
                </>
              )}
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            {product.colors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Color: <span className="font-normal text-muted-foreground">{selectedColor || 'Select a color'}</span></h3>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button key={color.name} onClick={() => setSelectedColor(color.name)} className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border'}`} style={{ backgroundColor: color.hex }} title={color.name} />
                  ))}
                </div>
              </div>
            )}

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

            <div className="flex gap-4 pb-16 md:pb-0">
              <Button
                size="lg"
                className={`flex-1 transition-all duration-300 ${
                  addedToCart
                    ? 'bg-accent hover:bg-accent/90 text-accent-foreground animate-scale-in'
                    : ''
                }`}
                onClick={handleAddToCart}
              >
                {addedToCart ? '🛒 Go to Cart' : 'Add to Cart'}
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={handleBuyNow}>Buy Now</Button>
              <Button size="lg" variant="outline" className="px-4" onClick={handleWishlist}>
                <Heart size={20} className={inWishlist ? 'fill-primary text-primary' : ''} />
              </Button>
            </div>

            {/* Pincode Checker */}
            <div className="pt-6 border-t border-border">
              <h3 className="font-semibold mb-3 text-sm">Check Delivery Availability</h3>
              <PincodeChecker />
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
              <TabsTrigger value="reviews">Reviews ({totalReviews})</TabsTrigger>
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
              <ReviewSection productId={product.id} />
            </TabsContent>
            <TabsContent value="shipping" className="mt-6">
              <div className="space-y-4">
                <div><h4 className="font-semibold mb-2">Delivery</h4><p className="text-muted-foreground">West Bengal: ₹20 flat handling, delivered in 7 business days. Outside West Bengal: free shipping on orders above ₹999 (₹99 otherwise), delivered in 10 business days.</p></div>
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
