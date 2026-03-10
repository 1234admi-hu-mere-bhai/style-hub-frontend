import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, ArrowRight } from 'lucide-react';
import { useActiveFlashSale, useFlashSaleProducts } from '@/hooks/useFlashSales';
import { dbToStoreProduct, DbProduct } from '@/hooks/useDbProducts';
import { useCurrency } from '@/hooks/useCurrency';

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-background/25 backdrop-blur-md flex items-center justify-center border border-accent/40 shadow-[0_0_15px_hsl(var(--accent)/0.3)]">
      <span className="text-xl sm:text-2xl font-bold text-accent-foreground font-mono drop-shadow-[0_0_8px_hsl(var(--accent)/0.5)]">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-[10px] sm:text-xs text-primary-foreground/70 mt-1 uppercase tracking-wider">{label}</span>
  </div>
);

const FlashSaleBanner = () => {
  const { flashSale, loading } = useActiveFlashSale();
  const { products, loading: productsLoading } = useFlashSaleProducts(flashSale?.product_ids || []);
  const { formatPrice } = useCurrency();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!flashSale) return;

    const calc = () => {
      const diff = new Date(flashSale.end_time).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [flashSale]);

  const storeProducts = useMemo(() => {
    if (!flashSale) return [];
    return products.map((p: any) => {
      const sp = dbToStoreProduct(p as DbProduct);
      // Apply flash sale discount
      const flashPrice = Math.round(sp.price * (1 - flashSale.discount_percentage / 100));
      return { ...sp, originalPrice: sp.price, price: flashPrice, discount: flashSale.discount_percentage };
    });
  }, [products, flashSale]);

  if (loading || !flashSale || expired) return null;

  return (
    <section className="py-6 lg:py-8">
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden bg-primary p-6 lg:p-10">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center animate-pulse">
                  <Zap className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl lg:text-3xl font-bold text-primary-foreground">
                    {flashSale.title}
                  </h2>
                  {flashSale.description && (
                    <p className="text-primary-foreground/70 text-sm mt-0.5">{flashSale.description}</p>
                  )}
                </div>
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-4 h-4 text-primary-foreground/70 mr-1 hidden sm:block" />
                <span className="text-base sm:text-lg font-bold text-primary-foreground mr-2 uppercase tracking-wide">Ends in</span>
                <CountdownUnit value={timeLeft.days} label="Days" />
                <span className="text-primary-foreground/50 text-xl font-bold mt-[-16px]">:</span>
                <CountdownUnit value={timeLeft.hours} label="Hrs" />
                <span className="text-primary-foreground/50 text-xl font-bold mt-[-16px]">:</span>
                <CountdownUnit value={timeLeft.minutes} label="Min" />
                <span className="text-primary-foreground/50 text-xl font-bold mt-[-16px]">:</span>
                <CountdownUnit value={timeLeft.seconds} label="Sec" />
              </div>
            </div>

            {/* Discount badge */}
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                {flashSale.discount_percentage}% OFF
              </span>
              <span className="text-primary-foreground/60 text-sm">on selected items</span>
            </div>

            {/* Products horizontal scroll */}
            {!productsLoading && storeProducts.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {storeProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex-shrink-0 w-36 sm:w-44 group"
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-2">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-bold uppercase">
                          <Zap className="w-2.5 h-2.5" /> -{product.discount}%
                        </span>
                      </div>
                    </div>
                    <h4 className="text-xs sm:text-sm font-medium text-primary-foreground truncate group-hover:underline">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-accent-foreground">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-primary-foreground/50 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* View all link */}
            <div className="mt-4 flex justify-end">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                View All Deals
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlashSaleBanner;
