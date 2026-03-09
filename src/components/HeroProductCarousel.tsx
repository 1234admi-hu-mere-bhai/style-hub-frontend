import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDbProducts, StoreProduct } from '@/hooks/useDbProducts';
import { useState, useEffect, useCallback } from 'react';

const HeroProductCarousel = () => {
  const { products, loading } = useDbProducts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayProducts = products.slice(0, 6);

  const next = useCallback(() => {
    if (displayProducts.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % displayProducts.length);
  }, [displayProducts.length]);

  const prev = useCallback(() => {
    if (displayProducts.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
  }, [displayProducts.length]);

  // Auto-swipe every 4 seconds
  useEffect(() => {
    if (displayProducts.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next, displayProducts.length]);

  const currentProduct = displayProducts[currentIndex];

  return (
    <section className="relative h-[70vh] lg:h-[85vh] overflow-hidden bg-secondary">
      {/* Product image background */}
      {currentProduct && (
        <div className="absolute inset-0">
          <img
            src={currentProduct.images[0]}
            alt={currentProduct.name}
            className="w-full h-full object-cover object-top transition-all duration-700"
            key={currentProduct.id}
          />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/50 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-xl animate-slide-up">
            <span className="inline-block badge-new mb-4 rounded-full px-4 py-1.5">
              NEW COLLECTION
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Crafted with Trust,
              <br />
              <span className="text-primary">Worn with Pride</span>
            </h1>

            {/* Current product info */}
            {currentProduct && (
              <div className="mb-6 p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 inline-block">
                <p className="text-sm text-muted-foreground mb-1">Now Showing</p>
                <h3 className="font-semibold text-lg text-foreground">{currentProduct.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-primary text-lg">₹{currentProduct.price.toLocaleString()}</span>
                  {currentProduct.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{currentProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                  {currentProduct.discount && (
                    <span className="badge-sale text-xs rounded px-2 py-0.5">-{currentProduct.discount}%</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="group">
                <Link to={currentProduct ? `/product/${currentProduct.id}` : '/products'}>
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {displayProducts.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background/90 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background/90 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {displayProducts.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'bg-primary w-6'
                    : 'bg-background/60 hover:bg-background/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroProductCarousel;
