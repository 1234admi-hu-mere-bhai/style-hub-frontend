import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, Star, Truck, RefreshCw, Shield, Ruler, Loader2, ChevronRight, Send } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SizeChartModal from '@/components/SizeChartModal';
import ReviewSection from '@/components/ReviewSection';
import ProductHighlights from '@/components/ProductHighlights';
import Product360Viewer from '@/components/Product360Viewer';
import ImageZoomDialog from '@/components/ImageZoomDialog';
import PincodeChecker from '@/components/PincodeChecker';
import { useDbProducts, useDbProduct } from '@/hooks/useDbProducts';
import { useProductReviews } from '@/hooks/useProductReviews';
import { getProductReviews } from '@/data/reviews';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';

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

  // Build the display color list, prepending the product's original/base
  // color (from product.image) so users can always revert to it.
  const displayColors = useMemo(() => {
    if (!product) return [] as Array<{ name: string; hex: string; image?: string; images?: string[] }>;
    const variants = product.colors || [];
    const baseImage = product.images?.[0];
    if (!baseImage) return variants;
    const alreadyPresent = variants.some((c) => c.image && c.image === baseImage);
    if (alreadyPresent) return variants;
    // Try to derive a meaningful base color name from product fields or name
    const KNOWN_COLORS = ['Black','White','Navy','Blue','Red','Green','Olive','Beige','Brown','Grey','Gray','Charcoal','Maroon','Burgundy','Pink','Purple','Yellow','Orange','Cream','Khaki','Teal','Mustard','Sky','Wine','Tan'];
    const fromName = KNOWN_COLORS.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(product.name));
    const baseName = product.colorFamily || fromName || 'Original';
    const original = {
      name: baseName,
      hex: '',
      image: baseImage,
      images: (product.images || []).filter((src) => src !== baseImage),
    };
    return [original, ...variants];
  }, [product]);


  // Auto-select first color (Original by default) when product loads
  useEffect(() => {
    if (product && displayColors.length > 0 && !selectedColor) {
      setSelectedColor(displayColors[0].name);
    }
  }, [product, displayColors, selectedColor]);

  const selectedColorVariant = useMemo(() => {
    if (!product || displayColors.length === 0) return undefined;
    return displayColors.find((color) => color.name === selectedColor) || displayColors[0];
  }, [product, displayColors, selectedColor]);

  // Per-color gallery: only show the selected color's own images while swiping.
  const galleryItems = useMemo(() => {
    if (!product) return [];
    const items: Array<
      | { type: 'image'; src: string; alt: string; fit: 'cover' | 'contain'; colorName?: string }
      | { type: 'rotation'; frames: string[]; colorName?: string }
    > = [];

    const seen = new Set<string>();
    const push = (src: string, alt: string, fit: 'cover' | 'contain', colorName?: string) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      items.push({ type: 'image', src, alt, fit, colorName });
    };

    if (product.colors.length > 0 && selectedColorVariant) {
      if (selectedColorVariant.image) push(selectedColorVariant.image, `${product.name} in ${selectedColorVariant.name}`, 'cover', selectedColorVariant.name);
      (selectedColorVariant.images || []).forEach((src, i) => push(src, `${product.name} ${selectedColorVariant.name} ${i + 2}`, 'cover', selectedColorVariant.name));

      if (items.length === 0) {
        product.images.forEach((src, i) => push(src, `${product.name} photo ${i + 1}`, 'cover'));
      }
    } else {
      product.images.forEach((src, i) => push(src, `${product.name} photo ${i + 1}`, 'cover'));
    }

    if (product.mannequinImage) push(product.mannequinImage, `${product.name} on mannequin`, 'contain');
    if (product.humanModelImage) push(product.humanModelImage, `${product.name} on model`, 'contain');
    if (product.rotationFrames && product.rotationFrames.length > 0) {
      items.push({ type: 'rotation', frames: product.rotationFrames });
    }
    return items;
  }, [product, selectedColorVariant]);

  // Load a color's own gallery and start from the first image when user taps a swatch.
  const handleSelectColor = (name: string) => {
    setSelectedColor(name);
    const el = scrollRef.current;
    setActiveIndex(0);
    el?.scrollTo({ left: 0, behavior: 'auto' });
  };

  // Track active image within the selected color only.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [selectedColor, galleryItems.length]);


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
  const selectedProductImage = selectedColorVariant?.image || product.images[0];

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
      image: selectedProductImage,
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
      image: selectedProductImage,
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

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on MUFFIGOUT APPAREL HUB`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      // user cancelled or share unsupported
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
            <div className="relative">
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

            {/* Floating action buttons over image */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={handleWishlist}
                aria-label="Add to wishlist"
                className="w-10 h-10 rounded-md bg-card/95 backdrop-blur border border-border shadow-md flex items-center justify-center hover:bg-card transition-colors"
              >
                <Heart size={18} className={inWishlist ? 'fill-primary text-primary' : 'text-foreground'} />
              </button>
              <button
                onClick={handleShare}
                aria-label="Share product"
                className="w-10 h-10 rounded-md bg-card/95 backdrop-blur border border-border shadow-md flex items-center justify-center hover:bg-card transition-colors"
              >
                <Send size={18} className="text-foreground" />
              </button>
            </div>

            {/* Floating rating badge — bottom-left over gallery */}
            <button
              type="button"
              onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-card/95 backdrop-blur border border-border rounded-full px-2.5 py-1 shadow-md hover:bg-card transition-colors"
              aria-label="View reviews"
            >
              {totalReviews > 0 ? (
                <>
                  <span className="text-sm font-semibold">{averageRating.toFixed(1)}</span>
                  <Star size={13} className="fill-success text-success" />
                  <span className="text-xs text-muted-foreground border-l border-border pl-1.5">
                    {totalReviews >= 1000 ? `${(totalReviews / 1000).toFixed(1)}K+` : totalReviews}
                  </span>
                </>
              ) : (
                <>
                  <Star size={13} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">No reviews</span>
                </>
              )}
            </button>
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
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">{product.name}</h1>
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

            

            {displayColors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">
                  Selected Color: <span className="font-normal text-muted-foreground">{selectedColor || 'Select a color'}</span>
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {displayColors.map((color) => {
                    const isSelected = selectedColor === color.name;
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleSelectColor(color.name)}
                        title={color.name}
                        className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
                      >
                        <span
                          className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all bg-secondary ${
                            isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {color.image ? (
                            <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="block w-full h-full" style={{ backgroundColor: color.hex }} />
                          )}
                        </span>
                        <span
                          className={`text-[11px] leading-tight text-center truncate w-full ${
                            isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
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

            <div className="flex gap-4">
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

        {/* Product Highlights — Meesho-style structured spec table */}
        <ProductHighlights product={product} selectedColor={selectedColor} />

        {/* Reviews — visually separated, attractive section */}
        <section
          id="reviews"
          className="mt-12 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 md:p-10 shadow-sm"
        >
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold">Customer Reviews</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real feedback from verified buyers
              </p>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm">
              <Star size={18} className="fill-gold text-gold" />
              <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">/ 5</span>
              <span className="text-xs text-muted-foreground ml-2 border-l border-border pl-2">
                {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
          <ReviewSection productId={product.id} />
        </section>

        {/* Product Description (moved from top) */}
        {product.description && (
          <section className="mt-12 rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">Product Description</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
          </section>
        )}

        {/* Shipping & Returns */}
        <section className="mt-12 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Truck size={18} className="text-primary" />
              <h4 className="font-semibold">Delivery</h4>
            </div>
            <p className="text-sm text-muted-foreground">West Bengal: ₹20 flat handling, delivered in 7 business days. Outside West Bengal: free shipping on orders above ₹999 (₹99 otherwise), delivered in 10 business days.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={18} className="text-primary" />
              <h4 className="font-semibold">Returns</h4>
            </div>
            <p className="text-sm text-muted-foreground">Easy returns within 7 days of delivery. Items must be unused with original tags attached.</p>
          </div>
        </section>

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
