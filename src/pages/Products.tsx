import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, LayoutGrid, X, Loader2, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useDbProducts } from '@/hooks/useDbProducts';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FIT_OPTIONS,
  FABRIC_OPTIONS,
  OCCASION_OPTIONS,
  COLOR_FAMILY_OPTIONS,
  SLEEVE_TYPE_OPTIONS,
  NECK_TYPE_OPTIONS,
  PRICE_CHIPS,
} from '@/lib/product-attributes';

type AttrKey = 'fit' | 'fabric' | 'occasion' | 'colorFamily' | 'sleeveType' | 'neckType' | 'collection';
const EMPTY_ATTRS: Record<AttrKey, string[]> = {
  fit: [], fabric: [], occasion: [], colorFamily: [], sleeveType: [], neckType: [], collection: [],
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const saleParam = searchParams.get('sale');
  const subcategoryParam = searchParams.get('subcategory');
  const priceParams = searchParams.getAll('price'); // chip labels
  const sizeParams = searchParams.getAll('size');
  const colorParams = searchParams.getAll('color');
  const searchQuery = searchParams.get('search') || '';

  const { products: allProducts, loading } = useDbProducts();

  const [sortBy, setSortBy] = useState('featured');
  const [selectedPriceChips, setSelectedPriceChips] = useState<string[]>(priceParams);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(sizeParams);
  const [selectedColors, setSelectedColors] = useState<string[]>(colorParams);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(subcategoryParam || '');
  const [attrs, setAttrs] = useState<Record<AttrKey, string[]>>(() => {
    const init = { ...EMPTY_ATTRS };
    (Object.keys(EMPTY_ATTRS) as AttrKey[]).forEach(k => {
      const vals = searchParams.getAll(k);
      if (vals.length) init[k] = vals;
    });
    return init;
  });
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Navy', hex: '#1e3a5f' },
    { name: 'Beige', hex: '#E8DCC8' },
    { name: 'Terracotta', hex: '#C65D3B' },
    { name: 'Grey', hex: '#808080' },
  ];
  const categories = ['men'];

  // Collection chips derived from currently loaded products
  const collectionOptions = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach(p => { if (p.collection) set.add(p.collection); });
    return Array.from(set).sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.subcategory || '').toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    if (saleParam === 'true') {
      result = result.filter((p) => p.discount);
    }
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    if (selectedSubcategory) {
      result = result.filter((p) => p.subcategory === selectedSubcategory);
    }
    if (selectedPriceChips.length > 0) {
      const ranges = selectedPriceChips
        .map(label => PRICE_CHIPS.find(c => c.label === label))
        .filter((c): c is typeof PRICE_CHIPS[number] => !!c);
      if (ranges.length) {
        result = result.filter(p => ranges.some(r => p.price >= r.min && p.price <= r.max));
      }
    }
    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }
    if (selectedColors.length > 0) {
      result = result.filter((p) => p.colors.some((c) => selectedColors.includes(c.name)));
    }
    if (attrs.fit.length) result = result.filter(p => p.fit && attrs.fit.includes(p.fit));
    if (attrs.fabric.length) result = result.filter(p => p.fabric && attrs.fabric.includes(p.fabric));
    if (attrs.occasion.length) result = result.filter(p => p.occasion && attrs.occasion.includes(p.occasion));
    if (attrs.colorFamily.length) result = result.filter(p => p.colorFamily && attrs.colorFamily.includes(p.colorFamily));
    if (attrs.sleeveType.length) result = result.filter(p => p.sleeveType && attrs.sleeveType.includes(p.sleeveType));
    if (attrs.neckType.length) result = result.filter(p => p.neckType && attrs.neckType.includes(p.neckType));
    if (attrs.collection.length) result = result.filter(p => p.collection && attrs.collection.includes(p.collection));

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'newest': result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      default: result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return result;
  }, [allProducts, searchQuery, saleParam, selectedCategories, selectedSubcategory, selectedPriceChips, selectedSizes, selectedColors, attrs, sortBy]);

  const toggleSize = (size: string) => setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
  const toggleColor = (color: string) => setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]);
  const toggleCategory = (category: string) => setSelectedCategories((prev) => prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]);
  const togglePriceChip = (label: string) => setSelectedPriceChips(prev => prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]);
  const toggleAttr = (key: AttrKey, value: string) => setAttrs(prev => ({
    ...prev,
    [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
  }));

  const attrChipCount = Object.values(attrs).reduce((sum, list) => sum + list.length, 0);

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedCategories([]);
    setSelectedPriceChips([]);
    setAttrs(EMPTY_ATTRS);
    setSearchParams({});
  };

  const activeFiltersCount =
    selectedSizes.length +
    selectedColors.length +
    selectedCategories.length +
    selectedPriceChips.length +
    attrChipCount;

  const attrGroups: { key: AttrKey; label: string; options: string[] }[] = [
    { key: 'fit', label: 'Fit', options: [...FIT_OPTIONS] },
    { key: 'fabric', label: 'Fabric', options: [...FABRIC_OPTIONS] },
    { key: 'occasion', label: 'Occasion', options: [...OCCASION_OPTIONS] },
    { key: 'colorFamily', label: 'Color Family', options: [...COLOR_FAMILY_OPTIONS] },
    { key: 'sleeveType', label: 'Sleeve Type', options: [...SLEEVE_TYPE_OPTIONS] },
    { key: 'neckType', label: 'Neck Type', options: [...NECK_TYPE_OPTIONS] },
    ...(collectionOptions.length ? [{ key: 'collection' as AttrKey, label: 'Collection', options: collectionOptions }] : []),
  ];

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold mb-4">Category</h3>
        <div className="space-y-3">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer">
              <Checkbox checked={selectedCategories.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
              <span className="capitalize">{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-4">Price Range</h3>
        <div className="flex flex-wrap gap-2">
          {PRICE_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => togglePriceChip(chip.label)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedPriceChips.includes(chip.label) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >{chip.label}</button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-4">Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button key={size} onClick={() => toggleSize(size)} className={`px-3 py-2 border rounded-md text-sm transition-colors ${selectedSizes.includes(size) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}>
              {size}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-4">Color</h3>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button key={color.name} onClick={() => toggleColor(color.name)} className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColors.includes(color.name) ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: color.hex }} title={color.name} />
          ))}
        </div>
      </div>
      {attrGroups.map(group => (
        <div key={group.key}>
          <h3 className="font-semibold mb-4">{group.label}</h3>
          <div className="flex flex-wrap gap-2">
            {group.options.map(opt => (
              <button
                key={opt}
                onClick={() => toggleAttr(group.key, opt)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  attrs[group.key].includes(opt) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >{opt}</button>
            ))}
          </div>
        </div>
      ))}
      {activeFiltersCount > 0 && <Button variant="outline" onClick={clearFilters} className="w-full">Clear All Filters</Button>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={14} />
          {searchQuery ? (
            <>
              <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
              <ChevronRight size={14} />
              <span className="text-foreground">Search: "{searchQuery}"</span>
            </>
          ) : categoryParam ? (
            <>
              <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
              <ChevronRight size={14} />
              <span className="text-foreground capitalize">{categoryParam}'s Collection</span>
            </>
          ) : saleParam ? (
            <>
              <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
              <ChevronRight size={14} />
              <span className="text-foreground">Sale</span>
            </>
          ) : (
            <span className="text-foreground">All Products</span>
          )}
        </nav>

        <div className="mb-8">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-2">
            {searchQuery 
              ? `Results for "${searchQuery}"` 
              : saleParam 
                ? 'Sale' 
                : categoryParam 
                  ? `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)}'s Collection` 
                  : 'All Products'}
          </h1>
          <p className="text-muted-foreground">{filteredProducts.length} products found</p>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg flex items-center gap-2"><Filter size={20} />Filters</h2>
                {activeFiltersCount > 0 && <span className="text-sm text-primary">{activeFiltersCount} active</span>}
              </div>
              <FilterContent />
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <SlidersHorizontal size={18} className="mr-2" />Filters
                      {activeFiltersCount > 0 && <span className="ml-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">{activeFiltersCount}</span>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                    <div className="mt-6"><FilterContent /></div>
                  </SheetContent>
                </Sheet>
                <div className="hidden sm:flex items-center border border-border rounded-md">
                  <button onClick={() => setGridCols(2)} className={`p-2 ${gridCols === 2 ? 'bg-secondary' : ''}`}><Grid size={18} /></button>
                  <button onClick={() => setGridCols(3)} className={`p-2 ${gridCols === 3 ? 'bg-secondary' : ''}`}><LayoutGrid size={18} /></button>
                  <button onClick={() => setGridCols(4)} className={`p-2 ${gridCols === 4 ? 'bg-secondary' : ''}`}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="3" width="4" height="4" /><rect x="10" y="3" width="4" height="4" /><rect x="17" y="3" width="4" height="4" />
                      <rect x="3" y="10" width="4" height="4" /><rect x="10" y="10" width="4" height="4" /><rect x="17" y="10" width="4" height="4" />
                    </svg>
                  </button>
                </div>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategories.map((cat) => (
                  <button key={cat} onClick={() => toggleCategory(cat)} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"><span className="capitalize">{cat}</span><X size={14} /></button>
                ))}
                {selectedPriceChips.map((label) => (
                  <button key={label} onClick={() => togglePriceChip(label)} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm">{label}<X size={14} /></button>
                ))}
                {selectedSizes.map((size) => (
                  <button key={size} onClick={() => toggleSize(size)} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm">Size: {size}<X size={14} /></button>
                ))}
                {selectedColors.map((color) => (
                  <button key={color} onClick={() => toggleColor(color)} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm">{color}<X size={14} /></button>
                ))}
                {(Object.entries(attrs) as [AttrKey, string[]][]).flatMap(([key, vals]) => vals.map(v => (
                  <button key={`${key}-${v}`} onClick={() => toggleAttr(key, v)} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm">{v}<X size={14} /></button>
                )))}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center min-h-[60vh] lg:min-h-[600px] py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid gap-4 lg:gap-6 ${gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-4">No products match your filters</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
