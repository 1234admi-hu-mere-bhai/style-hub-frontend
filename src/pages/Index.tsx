import { useState, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import SearchCommand from '@/components/SearchCommand';
import VoiceSearchModal from '@/components/VoiceSearchModal';
import ImageSearchModal from '@/components/ImageSearchModal';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RefreshCw, Shield, Headphones, Loader2, SlidersHorizontal, X, Mic, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import HeroProductCarousel from '@/components/HeroProductCarousel';
import { useDbProducts } from '@/hooks/useDbProducts';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import WalletHomeCard from '@/components/WalletHomeCard';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import {
  FIT_OPTIONS,
  FABRIC_OPTIONS,
  OCCASION_OPTIONS,
  COLOR_FAMILY_OPTIONS,
  SLEEVE_TYPE_OPTIONS,
  NECK_TYPE_OPTIONS,
  PRICE_CHIPS,
} from '@/lib/product-attributes';

import categoryShirts from '@/assets/category-shirts.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { products, loading } = useDbProducts();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceChips, setSelectedPriceChips] = useState<string[]>([]);

  type AttrKey = 'fit' | 'fabric' | 'occasion' | 'colorFamily' | 'sleeveType' | 'neckType' | 'collection';
  const EMPTY_ATTRS: Record<AttrKey, string[]> = {
    fit: [], fabric: [], occasion: [], colorFamily: [], sleeveType: [], neckType: [], collection: [],
  };
  const [attrs, setAttrs] = useState<Record<AttrKey, string[]>>(EMPTY_ATTRS);

  // Temporary filter state (used inside the sheet before Apply)
  const [tempFilter, setTempFilter] = useState('all');
  const [tempSizes, setTempSizes] = useState<string[]>([]);
  const [tempColors, setTempColors] = useState<string[]>([]);
  const [tempPriceChips, setTempPriceChips] = useState<string[]>([]);
  const [tempAttrs, setTempAttrs] = useState<Record<AttrKey, string[]>>(EMPTY_ATTRS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [discountCode, setDiscountCode] = useState('');


  const handleSubscribe = useCallback(() => {
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribing(true);
    const code = 'MGHUB20';
    setTimeout(() => {
      setDiscountCode(code);
      setSubscribing(false);
      toast.success(`🎉 Welcome offer unlocked — your code: ${code}`, { duration: 10000 });
    }, 800);
  }, [newsletterEmail]);

  const handleSearchFromVoice = useCallback((text: string) => {
    navigate(`/products?search=${encodeURIComponent(text)}`);
  }, [navigate]);

  const handleSearchFromImage = useCallback((terms: string) => {
    navigate(`/products?search=${encodeURIComponent(terms)}`);
  }, [navigate]);

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

  const toggleTempSize = (size: string) => setTempSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  const toggleTempColor = (color: string) => setTempColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  const toggleTempPriceChip = (label: string) => setTempPriceChips(prev => prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]);
  const toggleTempAttr = (key: AttrKey, val: string) => setTempAttrs(prev => ({
    ...prev,
    [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val],
  }));

  // Sync temp state when opening the sheet
  const handleOpenFilter = (open: boolean) => {
    if (open) {
      setTempFilter(activeFilter);
      setTempSizes(selectedSizes);
      setTempColors(selectedColors);
      setTempPriceChips(selectedPriceChips);
      setTempAttrs(attrs);
    }
    setFilterOpen(open);
  };

  const applyFilters = () => {
    setActiveFilter(tempFilter);
    setSelectedSizes(tempSizes);
    setSelectedColors(tempColors);
    setSelectedPriceChips(tempPriceChips);
    setAttrs(tempAttrs);
    setFilterOpen(false);
  };

  const clearTempFilters = () => {
    setTempFilter('all');
    setTempSizes([]);
    setTempColors([]);
    setTempPriceChips([]);
    setTempAttrs(EMPTY_ATTRS);
  };

  const toggleSize = (size: string) => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  const toggleColor = (color: string) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);

  const hardcodedCategories = ['T-Shirt', 'Shirt', 'Shorts', 'Joggers', 'Hoodie', 'Blazer', 'Jacket', 'Sweater'];
  const subcategories = useMemo(() => {
    const dbSubs = [...new Set(products.map(p => p.subcategory))].filter(Boolean);
    const merged = [...new Set([...hardcodedCategories, ...dbSubs])];
    return merged;
  }, [products]);

  // Distinct collections present in catalog (free-text field)
  const collectionOptions = useMemo(() => {
    return [...new Set(products.map(p => p.collection).filter(Boolean) as string[])];
  }, [products]);

  const productMatchesPriceChips = (price: number) => {
    if (selectedPriceChips.length === 0) return true;
    return selectedPriceChips.some(label => {
      const chip = PRICE_CHIPS.find(c => c.label === label);
      return chip ? price >= chip.min && price <= chip.max : false;
    });
  };

  const featuredProducts = useMemo(() => {
    let filtered = activeFilter === 'all'
      ? products
      : products.filter(p => p.subcategory === activeFilter);

    filtered = filtered.filter(p => productMatchesPriceChips(p.price));

    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => p.sizes.some(s => selectedSizes.includes(s)));
    }
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => p.colors.some(c => selectedColors.includes(c.name)));
    }
    if (attrs.fit.length) filtered = filtered.filter(p => p.fit && attrs.fit.includes(p.fit));
    if (attrs.fabric.length) filtered = filtered.filter(p => p.fabric && attrs.fabric.includes(p.fabric));
    if (attrs.occasion.length) filtered = filtered.filter(p => p.occasion && attrs.occasion.includes(p.occasion));
    if (attrs.colorFamily.length) filtered = filtered.filter(p => p.colorFamily && attrs.colorFamily.includes(p.colorFamily));
    if (attrs.sleeveType.length) filtered = filtered.filter(p => p.sleeveType && attrs.sleeveType.includes(p.sleeveType));
    if (attrs.neckType.length) filtered = filtered.filter(p => p.neckType && attrs.neckType.includes(p.neckType));
    if (attrs.collection.length) filtered = filtered.filter(p => p.collection && attrs.collection.includes(p.collection));

    return filtered.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, activeFilter, selectedPriceChips, selectedSizes, selectedColors, attrs]);

  const attrChipCount = Object.values(attrs).reduce((sum, list) => sum + list.length, 0);
  const activeFiltersCount =
    selectedSizes.length +
    selectedColors.length +
    selectedPriceChips.length +
    attrChipCount +
    (activeFilter !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setActiveFilter('all');
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceChips([]);
    setAttrs(EMPTY_ATTRS);
  };


  const categories = [
    { name: 'Shirts', image: categoryShirts, href: '/products?subcategory=Shirt' },
  ];

  const features = [
    { icon: Truck, title: 'Complimentary Shipping', desc: 'On orders above ₹999' },
    { icon: RefreshCw, title: 'Hassle-Free Returns', desc: '7-day return window' },
    { icon: Shield, title: 'Secure Checkout', desc: 'Encrypted, PCI-compliant payments' },
    { icon: Headphones, title: 'Dedicated Support', desc: 'Available 7 days a week' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
      <VoiceSearchModal 
        open={voiceSearchOpen} 
        onOpenChange={setVoiceSearchOpen} 
        onResult={handleSearchFromVoice} 
      />
      <ImageSearchModal 
        open={imageSearchOpen} 
        onOpenChange={setImageSearchOpen} 
        onSearch={handleSearchFromImage} 
      />

      {/* Hero Product Carousel */}
      <HeroProductCarousel />

      {/* Flash Sale Banner - Below Hero, Above Categories */}
      <FlashSaleBanner />




      {/* Categories */}
      <section className="py-6 lg:py-16">
        <div className="px-3 lg:container lg:mx-auto lg:px-4">
          <div className="text-center mb-4 lg:mb-12">
            <h2 className="font-serif text-2xl lg:text-4xl font-bold mb-1 lg:mb-4">
              Shirt Collection
            </h2>
            <p className="text-xs lg:text-base text-muted-foreground max-w-xl mx-auto">
              Explore sharp everyday shirts crafted for confident men
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:gap-6 lg:max-w-2xl lg:mx-auto">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className="group relative h-[280px] lg:h-[520px] overflow-hidden rounded-none lg:rounded-lg -mx-3 lg:mx-0 shadow-elevated"
              >
                <img
                  src={cat.image}
                  alt="Premium men's shirt collection"
                  width={1280}
                  height={900}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8 text-cream">
                  <Badge variant="outline" className="mb-3 border-cream/50 bg-charcoal/40 text-cream backdrop-blur-sm">Premium Shirts</Badge>
                  <h3 className="font-serif text-3xl lg:text-5xl font-bold mb-2">{cat.name}</h3>
                  <p className="mb-4 max-w-xs text-sm text-cream/85">Crisp fits, rich fabrics, and styling-ready colors.</p>
                  <span className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-glow transition-transform group-hover:translate-x-1">
                    Shop Shirts
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-6 lg:py-24 bg-secondary/30">
        <div className="px-3 lg:container lg:mx-auto lg:px-4">
          <div className="flex items-end justify-between mb-4 lg:mb-12">
            <div>
              <h2 className="font-serif text-2xl lg:text-4xl font-bold mb-1 lg:mb-4">
                Featured Products
              </h2>
              <p className="text-xs lg:text-base text-muted-foreground">
                A selection of our most-loved styles
              </p>
            </div>
          </div>

          {/* Filter Button */}
          <div className="flex flex-wrap items-center gap-2 mb-4 lg:mb-8">
            <Sheet open={filterOpen} onOpenChange={handleOpenFilter}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="group relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow ring-1 ring-primary/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                  style={{ backgroundImage: 'var(--gradient-vibrant)' }}
                >
                  <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <SlidersHorizontal size={18} className="relative" />
                  <span className="relative tracking-wide uppercase">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="relative ml-1 grid place-items-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-background text-primary text-xs font-bold ring-2 ring-primary-foreground/60">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle>Filters</SheetTitle>
                    <button onClick={clearTempFilters} className="text-sm text-destructive font-medium flex items-center gap-1">
                      <X size={14} /> Clear All
                    </button>
                  </div>
                </SheetHeader>
                <div className="py-6 space-y-8 overflow-y-auto flex-1">
                  {/* Category */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Category</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTempFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          tempFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >All</button>
                      {subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setTempFilter(sub)}
                          className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                            tempFilter === sub ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
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
                          onClick={() => toggleTempSize(size)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                            tempSizes.includes(size) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
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
                          onClick={() => toggleTempColor(color.name)}
                          className="flex flex-col items-center gap-1"
                          title={color.name}
                        >
                          <span
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              tempColors.includes(color.name) ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border'
                            }`}
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[10px] text-muted-foreground">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Chips */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Price Range</h3>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_CHIPS.map(chip => (
                        <button
                          key={chip.label}
                          onClick={() => toggleTempPriceChip(chip.label)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            tempPriceChips.includes(chip.label) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >{chip.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Attribute filters */}
                  {([
                    { key: 'fit' as AttrKey, label: 'Fit', options: [...FIT_OPTIONS] },
                    { key: 'fabric' as AttrKey, label: 'Fabric', options: [...FABRIC_OPTIONS] },
                    { key: 'occasion' as AttrKey, label: 'Occasion', options: [...OCCASION_OPTIONS] },
                    { key: 'colorFamily' as AttrKey, label: 'Color Family', options: [...COLOR_FAMILY_OPTIONS] },
                    { key: 'sleeveType' as AttrKey, label: 'Sleeve Type', options: [...SLEEVE_TYPE_OPTIONS] },
                    { key: 'neckType' as AttrKey, label: 'Neck Type', options: [...NECK_TYPE_OPTIONS] },
                    ...(collectionOptions.length ? [{ key: 'collection' as AttrKey, label: 'Collection', options: collectionOptions }] : []),
                  ]).map(group => (
                    <div key={group.key}>
                      <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">{group.label}</h3>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => toggleTempAttr(group.key, opt)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              tempAttrs[group.key].includes(opt) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                          >{opt}</button>
                        ))}
                      </div>
                    </div>
                  ))}

                </div>

                {/* Apply Button */}
                <div className="border-t border-border pt-4 pb-2">
                  <Button onClick={applyFilters} className="w-full" size="lg">
                    Apply Filters
                  </Button>
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
                {selectedPriceChips.map(label => (
                  <button key={label} onClick={() => setSelectedPriceChips(prev => prev.filter(p => p !== label))} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium">
                    {label} <X size={12} />
                  </button>
                ))}
                {(Object.entries(attrs) as [AttrKey, string[]][]).flatMap(([key, vals]) => vals.map(v => (
                  <button key={`${key}-${v}`} onClick={() => setAttrs(prev => ({ ...prev, [key]: prev[key].filter(x => x !== v) }))} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium">
                    {v} <X size={12} />
                  </button>
                )))}

              </>
            )}
          </div>

          {/* View All with filters link */}
          {activeFiltersCount > 0 && (
            <div className="mb-6">
              <Link
                to={`/products?${new URLSearchParams([
                  ...(activeFilter !== 'all' ? [['subcategory', activeFilter]] : []),
                  ...selectedPriceChips.map(label => ['price', label] as [string, string]),

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
            <div className="flex justify-center items-center min-h-[60vh] lg:min-h-[600px] py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div key={`${activeFilter}-${selectedSizes.join()}-${selectedColors.join()}-${selectedPriceChips.join()}`} className="grid grid-cols-2 lg:grid-cols-4 gap-px lg:gap-6 -mx-3 lg:mx-0 bg-border lg:bg-transparent">

              {featuredProducts.map((product, index) => (
                <div key={product.id} className="animate-fade-in bg-background" style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-16">No products match your selection. Try adjusting the filters.</p>
          )}

        </div>
      </section>

      {/* Trust Badges — premium & airy */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        {/* Soft gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />

        <div className="relative px-4 lg:container lg:mx-auto lg:px-4">
          {/* Section heading */}
          <div className="text-center mb-12 lg:mb-16">
            <span className="inline-block text-[11px] lg:text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">
              The MUFFIGOUT Promise
            </span>
            <h2 className="text-2xl lg:text-4xl font-bold tracking-tight">
              Crafted with Trust,{' '}
              <span className="text-gradient-vibrant">Worn with Pride</span>
            </h2>
            <p className="mt-3 text-sm lg:text-base text-muted-foreground max-w-xl mx-auto">
              Everything you need for a confident shopping experience — built around quality, care, and convenience.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-card border border-border/60 rounded-2xl p-6 lg:p-7 text-center transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.35)]"
              >
                {/* Subtle hover gradient overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" aria-hidden="true" />

                {/* Icon */}
                <div className="relative mx-auto mb-5 w-16 h-16 lg:w-[72px] lg:h-[72px]">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                  {/* Icon background */}
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <feature.icon className="w-7 h-7 lg:w-8 lg:h-8 text-primary transition-colors duration-300 group-hover:text-primary" strokeWidth={1.75} />
                  </div>
                </div>

                {/* Text */}
                <h3 className="relative font-semibold text-base lg:text-lg leading-tight mb-2 transition-colors duration-300 group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="relative text-xs lg:text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discount Banner */}
      <section className="py-6 lg:py-24">
        <div className="lg:container lg:mx-auto lg:px-4">
          <div className="relative rounded-none lg:rounded-2xl overflow-hidden bg-primary p-6 lg:p-16 text-primary-foreground">
            <div className="relative z-10 max-w-xl">
              <span className="inline-block bg-primary-foreground/20 px-4 py-1 rounded-full text-sm font-medium mb-4">
                EXCLUSIVE OFFER
              </span>
              <h2 className="font-serif text-3xl lg:text-5xl font-bold mb-4">
                Unlock Your
                <br />
                MG Perks
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Subscribe for early access to new arrivals and a 20% welcome offer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {discountCode ? (
                  <div className="flex-1 flex items-center gap-3">
                    <div className="px-4 py-3 rounded-lg bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground font-bold text-lg tracking-widest select-all">
                      {discountCode}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(discountCode);
                        toast.success('Code copied to clipboard');
                      }}
                      className="px-4 py-3 rounded-lg bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email"
                      autoComplete="off"
                      className="flex-1 px-4 py-3 rounded-lg bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:border-primary-foreground"
                    />
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    >
                      {subscribing ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                  </>
                )}
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
