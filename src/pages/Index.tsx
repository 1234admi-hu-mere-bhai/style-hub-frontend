import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RefreshCw, Shield, Headphones, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import HeroProductCarousel from '@/components/HeroProductCarousel';
import { useDbProducts } from '@/hooks/useDbProducts';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';

import categoryMen from '@/assets/category-men.jpg';

const Index = () => {
  const { products, loading } = useDbProducts();
  const [activeFilter, setActiveFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];
  const colors = [
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Navy', hex: '#1e3a5f' },
    { name: 'Beige', hex: '#E8DCC8' },
    { name: 'Terracotta', hex: '#C65D3B' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Olive', hex: '#556B2F' },
    { name: 'Maroon', hex: '#800000' },
    { name: 'Sky Blue', hex: '#87CEEB' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Cream', hex: '#FFFDD0' },
    { name: 'Charcoal', hex: '#36454F' },
    { name: 'Sage', hex: '#B2AC88' },
    { name: 'Camel', hex: '#C19A6B' },
    { name: 'Mustard', hex: '#FFDB58' },
    { name: 'Burgundy', hex: '#800020' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'Peach', hex: '#FFDAB9' },
    { name: 'Rust', hex: '#B7410E' },
    { name: 'Tan', hex: '#D2B48C' },
    { name: 'Mint', hex: '#98FF98' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Red', hex: '#DC2626' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Green', hex: '#16A34A' },
    { name: 'Yellow', hex: '#FACC15' },
    { name: 'Orange', hex: '#EA580C' },
    { name: 'Purple', hex: '#9333EA' },
  ];

  const toggleSize = (size: string) => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  const toggleColor = (color: string) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);

  const subcategories = useMemo(() => {
    const subs = [...new Set(products.map(p => p.subcategory))].filter(Boolean);
    return subs;
  }, [products]);

  const featuredProducts = useMemo(() => {
    let filtered = activeFilter === 'all' 
      ? products 
      : products.filter(p => p.subcategory === activeFilter);
    
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => p.sizes.some(s => selectedSizes.includes(s)));
    }
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => p.colors.some(c => selectedColors.includes(c.name)));
    }
    
    return filtered.slice(0, 8);
  }, [products, activeFilter, priceRange, selectedSizes, selectedColors]);

  const activeFiltersCount = selectedSizes.length + selectedColors.length + (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0) + (activeFilter !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setActiveFilter('all');
    setPriceRange([0, 5000]);
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  const categories = [
    { name: 'Men', image: categoryMen, href: '/products?category=men' },
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: RefreshCw, title: 'Easy Returns', desc: '7 days return policy' },
    { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
    { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Product Carousel */}
      <HeroProductCarousel />
      {/* Features Bar */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore our curated men's collection
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className="group relative h-[400px] lg:h-[500px] overflow-hidden rounded-lg"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-cream">
                  <h3 className="font-serif text-2xl font-bold mb-2">{cat.name}</h3>
                  <span className="inline-flex items-center text-sm font-medium uppercase tracking-wider group-hover:underline">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-4">
                Featured Products
              </h2>
              <p className="text-muted-foreground">
                Handpicked styles loved by our customers
              </p>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/products">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Filter Button */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2">
                  <SlidersHorizontal size={16} />
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle>Filters</SheetTitle>
                    {activeFiltersCount > 0 && (
                      <button onClick={clearAllFilters} className="text-sm text-destructive font-medium flex items-center gap-1">
                        <X size={14} /> Clear All
                      </button>
                    )}
                  </div>
                </SheetHeader>
                <div className="py-6 space-y-8">
                  {/* Category */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Category</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >All</button>
                      {subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setActiveFilter(sub)}
                          className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                            activeFilter === sub ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >{sub}</button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                            selectedSizes.includes(size) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >{size}</button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => toggleColor(color.name)}
                          className="flex flex-col items-center gap-1"
                          title={color.name}
                        >
                          <span
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              selectedColors.includes(color.name) ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border'
                            }`}
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[10px] text-muted-foreground">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Price Range</h3>
                    <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={5000} step={100} />
                    <div className="flex justify-between text-sm text-muted-foreground mt-3">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Active filter tags */}
            {activeFiltersCount > 0 && (
              <>
                {activeFilter !== 'all' && (
                  <button onClick={() => setActiveFilter('all')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium capitalize">
                    {activeFilter} <X size={12} />
                  </button>
                )}
                {selectedSizes.map(s => (
                  <button key={s} onClick={() => toggleSize(s)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium">
                    {s} <X size={12} />
                  </button>
                ))}
                {selectedColors.map(c => (
                  <button key={c} onClick={() => toggleColor(c)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium">
                    {c} <X size={12} />
                  </button>
                ))}
                {(priceRange[0] > 0 || priceRange[1] < 5000) && (
                  <button onClick={() => setPriceRange([0, 5000])} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium">
                    ₹{priceRange[0]}-₹{priceRange[1]} <X size={12} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* View All with filters link */}
          {activeFiltersCount > 0 && (
            <div className="mb-6">
              <Link
                to={`/products?${new URLSearchParams([
                  ...(activeFilter !== 'all' ? [['subcategory', activeFilter]] : []),
                  ...(priceRange[0] > 0 ? [['priceMin', String(priceRange[0])]] : []),
                  ...(priceRange[1] < 5000 ? [['priceMax', String(priceRange[1])]] : []),
                  ...selectedSizes.map(s => ['size', s]),
                  ...selectedColors.map(c => ['color', c]),
                ]).toString()}`}
                className="inline-flex items-center text-sm font-medium text-primary hover:underline gap-1"
              >
                View all matching products
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div key={`${activeFilter}-${selectedSizes.join()}-${selectedColors.join()}-${priceRange.join()}`} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-16">No products available yet.</p>
          )}

          <div className="text-center mt-8 md:hidden">
            <Button variant="outline" asChild>
              <Link to="/products">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Discount Banner */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden bg-primary p-8 lg:p-16 text-primary-foreground">
            <div className="relative z-10 max-w-xl">
              <span className="inline-block bg-primary-foreground/20 px-4 py-1 rounded-full text-sm font-medium mb-4">
                LIMITED TIME OFFER
              </span>
              <h2 className="font-serif text-3xl lg:text-5xl font-bold mb-4">
                Get 30% Off
                <br />
                Your First Order
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Sign up for our newsletter and receive an exclusive discount code.
                Plus, be the first to know about new arrivals and sales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:border-primary-foreground"
                />
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Subscribe
                </Button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                fill="currentColor"
              >
                <circle cx="100" cy="100" r="100" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
