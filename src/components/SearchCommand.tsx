import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { products, Product } from '@/data/products';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchCommand = ({ open, onOpenChange }: SearchCommandProps) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredProducts = query.length > 0
    ? products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelect = useCallback((productId: string) => {
    onOpenChange(false);
    setQuery('');
    navigate(`/product/${productId}`);
  }, [navigate, onOpenChange]);

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <Command className="rounded-lg" shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-secondary rounded"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <CommandList className="max-h-[400px]">
            {query.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <p>Start typing to search products...</p>
                <p className="mt-2 text-xs">
                  Press <kbd className="px-2 py-1 bg-secondary rounded text-xs">⌘K</kbd> to open search anytime
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <CommandEmpty>No products found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Products">
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product.id)}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-14 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{product.price.toLocaleString()}</p>
                      {product.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          {query.length > 0 && filteredProducts.length > 0 && (
            <div className="border-t border-border p-3">
              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/products?search=${encodeURIComponent(query)}`);
                }}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                View all results for "{query}"
              </button>
            </div>
          )}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default SearchCommand;
