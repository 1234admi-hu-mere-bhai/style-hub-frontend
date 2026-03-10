import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, ArrowLeft, Mic, Camera } from 'lucide-react';
import { useDbProducts } from '@/hooks/useDbProducts';
import VoiceSearchModal from './VoiceSearchModal';
import ImageSearchModal from './ImageSearchModal';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RECENT_SEARCHES_KEY = 'muffi-recent-searches';
const MAX_RECENT = 5;

const POPULAR_SEARCHES = [
  'blazer', 'jacket', 'hoodie', 'sweater', 'joggers',
  'shirt', 'polo', 'cargo pants', 'kurta', 'tracksuit',
  'jeans', 'shorts', 't-shirt', 'combo set',
];

const getRecentSearches = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
};

const addRecentSearch = (term: string) => {
  const recent = getRecentSearches().filter((s) => s !== term);
  recent.unshift(term);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

const removeRecentSearch = (term: string) => {
  const recent = getRecentSearches().filter((s) => s !== term);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
};

const SearchCommand = ({ open, onOpenChange }: SearchCommandProps) => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { products } = useDbProducts();

  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      setQuery('');
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const filteredProducts = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.subcategory || '').toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, products]);

  const handleSearch = useCallback(
    (term: string) => {
      if (!term.trim()) return;
      addRecentSearch(term.trim());
      onOpenChange(false);
      navigate(`/products?search=${encodeURIComponent(term.trim())}`);
    },
    [navigate, onOpenChange]
  );

  const handleProductSelect = useCallback(
    (productId: string, name: string) => {
      addRecentSearch(name);
      onOpenChange(false);
      navigate(`/product/${productId}`);
    },
    [navigate, onOpenChange]
  );

  const handleRemoveRecent = (term: string) => {
    removeRecentSearch(term);
    setRecentSearches(getRecentSearches());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in">
      {/* Search header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 -ml-1 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2.5 border border-border">
            <Search size={18} className="text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch(query);
              }}
              placeholder="Search by Keyword or Product Name"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-0.5 hover:bg-secondary rounded-full">
                <X size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {query.length >= 2 ? (
          /* Search results */
          <div className="py-2">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No products found for "{query}"</p>
              </div>
            ) : (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Products
                </div>
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product.id, product.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-14 object-cover rounded-md border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {product.subcategory || product.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">₹{product.price.toLocaleString()}</p>
                      {product.originalPrice && (
                        <p className="text-[11px] text-muted-foreground line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => handleSearch(query)}
                  className="w-full py-3 text-center text-sm font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border mt-1"
                >
                  View all results for "{query}"
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Default: Recent + Popular */
          <div>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="py-3">
                <div className="px-4 py-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Your Recent Searches</h3>
                </div>
                {recentSearches.map((term) => (
                  <div key={term} className="flex items-center hover:bg-secondary/50 transition-colors">
                    <button
                      onClick={() => handleSearch(term)}
                      className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <Clock size={18} className="text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground">{term}</span>
                    </button>
                    <button
                      onClick={() => handleRemoveRecent(term)}
                      className="p-2 mr-2 hover:bg-secondary rounded-full"
                    >
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            {recentSearches.length > 0 && (
              <div className="h-2 bg-secondary/40" />
            )}

            {/* Popular Searches */}
            <div className="py-3">
              <div className="px-4 py-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Popular Searches</h3>
              </div>
              <div className="px-4 pt-1 pb-2 flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3.5 py-1.5 rounded-full border border-border bg-secondary/30 text-sm text-foreground hover:bg-secondary hover:border-primary/30 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchCommand;
