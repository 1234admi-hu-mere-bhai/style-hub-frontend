import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';

interface CartDrawerProps {
  onClose: () => void;
}

const CartDrawer = ({ onClose }: CartDrawerProps) => {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();
  const { formatPrice } = useCurrency();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="font-serif text-xl font-semibold mb-2">Your cart is empty</h3>
        <p className="text-muted-foreground mb-6">
          Add items to your cart to continue shopping
        </p>
        <Button onClick={onClose} asChild>
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {items.map((item) => (
          <div
            key={`${item.id}-${item.size}-${item.color}`}
            className="flex gap-4 p-4 bg-secondary/50 rounded-lg"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-24 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{item.name}</h4>
              <p className="text-sm text-muted-foreground">
                Size: {item.size} | Color: {item.color}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.size, item.color, item.quantity - 1)
                    }
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.size, item.color, item.quantity + 1)
                    }
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id, item.size, item.color)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-2">
                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    {formatPrice(item.originalPrice * item.quantity)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        <div className="flex justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className={totalPrice <= 1 || totalPrice >= 999 ? 'text-success font-medium' : 'text-foreground'}>
            {totalPrice <= 1 || totalPrice >= 999 ? 'FREE' : formatPrice(99)}
          </span>
        </div>
        {totalPrice > 1 && totalPrice < 999 && (
          <p className="text-xs text-primary">
            Add {formatPrice(999 - totalPrice)} more for free shipping!
          </p>
        )}
        <Button className="w-full" size="lg" asChild>
          <Link to="/checkout" onClick={onClose}>
            Proceed to Checkout
          </Link>
        </Button>
        <Button variant="outline" className="w-full" onClick={onClose} asChild>
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
};

export default CartDrawer;
