import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Truck, PartyPopper, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';

interface CartDrawerProps {
  onClose: () => void;
}

const CartDrawer = ({ onClose }: CartDrawerProps) => {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();
  const { formatPrice } = useCurrency();

  const totalSavings = items.reduce((acc, i) => {
    if (i.originalPrice && i.originalPrice > i.price) {
      return acc + (i.originalPrice - i.price) * i.quantity;
    }
    return acc;
  }, 0);
  const itemCount = items.reduce((a, i) => a + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/15 via-secondary to-accent/15 flex items-center justify-center border border-primary/20 shadow-glow">
            <ShoppingBag className="w-12 h-12 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="font-serif text-2xl font-bold mb-2 tracking-tight">Your bag is empty</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Discover crafted pieces made for you. Start building your look.
        </p>
        <Button onClick={onClose} asChild className="rounded-full px-6 h-11 shadow-glow">
          <Link to="/products">
            <Sparkles size={16} className="mr-2" />
            Explore the collection
          </Link>
        </Button>
      </div>
    );
  }

  const hasTestItem = items.some(i => i.price <= 1);
  const isFreeShipping = hasTestItem || totalPrice >= FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);
  const progressPct = hasTestItem
    ? 100
    : Math.min(100, Math.round((totalPrice / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="flex flex-col h-full">
      {/* Item count strip */}
      <div className="flex items-center justify-between px-1 pb-3 pt-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{itemCount}</span>{' '}
          {itemCount === 1 ? 'item' : 'items'} in your bag
        </p>
        {totalSavings > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
            <Tag size={11} />
            Saving {formatPrice(totalSavings)}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
        {items.map((item) => {
          const hasDiscount = item.originalPrice && item.originalPrice > item.price;
          const discountPct = hasDiscount
            ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
            : 0;

          return (
            <div
              key={`${item.id}-${item.size}-${item.color}`}
              className="group relative flex gap-3 p-3 rounded-2xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/50 hover:border-primary/40 hover:shadow-glow transition-all duration-300"
            >
              {/* Image with subtle overlay */}
              <div className="relative shrink-0">
                <div className="w-20 h-24 overflow-hidden rounded-xl bg-background">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {hasDiscount && (
                  <span className="absolute -top-1.5 -left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm">
                    -{discountPct}%
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <h4 className="font-semibold text-sm leading-snug line-clamp-2 pr-6">
                  {item.name}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  <span className="uppercase tracking-wide">{item.size}</span>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span className="capitalize">{item.color}</span>
                </p>

                {/* Price */}
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-bold text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] text-muted-foreground line-through">
                      {formatPrice(item.originalPrice! * item.quantity)}
                    </span>
                  )}
                </div>

                {/* Qty stepper */}
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 rounded-full bg-background border border-border/60 p-0.5 shadow-sm">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.size, item.color, item.quantity - 1)
                      }
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.size, item.color, item.quantity + 1)
                      }
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/60 pt-4 mt-3 space-y-3">
        {/* Free-shipping progress */}
        <div
          className={`relative overflow-hidden rounded-2xl p-3.5 border transition-all ${
            isFreeShipping
              ? 'bg-success/10 border-success/30'
              : 'bg-gradient-to-br from-primary/8 via-secondary/40 to-accent/8 border-primary/20'
          }`}
        >
          <div className="flex items-center gap-2 text-sm mb-2">
            {isFreeShipping ? (
              <>
                <PartyPopper size={17} className="text-success flex-shrink-0" />
                <span className="font-semibold text-success">
                  {hasTestItem ? 'Free shipping on this order' : 'Free shipping unlocked!'}
                </span>
              </>
            ) : (
              <>
                <Truck size={17} className="text-primary flex-shrink-0" />
                <span className="text-foreground text-[13px]">
                  Add{' '}
                  <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {formatPrice(remaining)}
                  </span>{' '}
                  more to get{' '}
                  <span className="font-bold">FREE shipping</span>
                </span>
              </>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-background/70 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isFreeShipping
                  ? 'bg-gradient-to-r from-success via-success to-success/70'
                  : 'bg-gradient-to-r from-primary via-accent to-primary'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 opacity-80">
            West Bengal: flat ₹20 handling still applies.
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-1.5 px-1">
          {totalSavings > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-success font-medium">Total savings</span>
              <span className="text-success font-bold">− {formatPrice(totalSavings)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-serif text-2xl font-bold tracking-tight">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        <Button
          className="w-full rounded-full h-12 text-[15px] font-bold shadow-glow bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all"
          asChild
        >
          <Link to="/checkout" onClick={onClose}>
            Proceed to Checkout
            <span className="ml-2 opacity-90">→</span>
          </Link>
        </Button>
        <button
          onClick={onClose}
          className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
};

export default CartDrawer;
