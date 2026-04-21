import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Loader2,
  ChevronRight,
  Search,
  Truck,
  CheckCircle2,
  Undo2,
  IndianRupee,
  XCircle,
  RefreshCw,
  CreditCard,
  Filter,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  image: string | null;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: ShippingAddress;
  invoice_url: string | null;
  delivered_at: string | null;
  refund_amount: number | null;
  refund_eta: string | null;
  refund_processed_at: string | null;
  created_at: string;
  tracking_awb: string | null;
  order_items: OrderItem[];
}

// One row per item (Meesho-style)
interface OrderItemRow {
  order: Order;
  item: OrderItem;
}

// Headline shown above the item title (e.g. "Refund Successful", "Order Cancelled", "Delivered")
const getHeadline = (
  order: Order,
  formatPrice: (n: number) => string,
): { label: string; sub: string | null; tone: 'success' | 'danger' | 'info' | 'muted' | 'warn' } => {
  const status = order.status;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

  if (status === 'refund_processed') {
    return {
      label: 'Refund Successful',
      sub: `${formatPrice(Number(order.refund_amount ?? order.total))} refunded${
        order.refund_processed_at ? ` on ${formatDate(order.refund_processed_at)}` : ''
      }`,
      tone: 'success',
    };
  }
  if (status === 'return_approved' || status === 'return_picked_up') {
    return {
      label: status === 'return_picked_up' ? 'Return Picked Up' : 'Return Approved',
      sub: order.refund_eta
        ? `Refund of ${formatPrice(Number(order.refund_amount ?? order.total))} expected by ${formatDate(
            order.refund_eta,
          )}`
        : 'Refund will be initiated soon',
      tone: 'info',
    };
  }
  if (status === 'return_requested') {
    return { label: 'Return Requested', sub: 'We will get in touch shortly', tone: 'info' };
  }
  if (status === 'return_rejected') {
    return { label: 'Return Rejected', sub: 'Contact support for details', tone: 'danger' };
  }
  if (status === 'cancelled') {
    return { label: 'Order Cancelled', sub: 'As per your request', tone: 'danger' };
  }
  if (status === 'delivered') {
    return {
      label: 'Delivered',
      sub: order.delivered_at ? `On ${formatDate(order.delivered_at)}` : null,
      tone: 'success',
    };
  }
  if (status === 'out_for_delivery') {
    return { label: 'Out for Delivery', sub: 'Arriving today', tone: 'info' };
  }
  if (status === 'shipped') {
    return {
      label: 'Shipped',
      sub: order.tracking_awb ? `AWB ${order.tracking_awb}` : 'On its way',
      tone: 'info',
    };
  }
  if (status === 'confirmed') {
    return { label: 'Order Confirmed', sub: 'Preparing for shipment', tone: 'info' };
  }
  if (status === 'placed') {
    return { label: 'Order Placed', sub: 'Awaiting confirmation', tone: 'muted' };
  }
  if (status.startsWith('replacement')) {
    return {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      sub: 'Replacement in progress',
      tone: 'warn',
    };
  }
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    sub: null,
    tone: 'muted',
  };
};

const toneClasses: Record<string, string> = {
  success: 'text-success',
  danger: 'text-destructive',
  info: 'text-foreground',
  warn: 'text-accent',
  muted: 'text-foreground',
};

const FILTER_OPTIONS = [
  { key: 'active', label: 'In progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returns', label: 'Returns & refunds' },
] as const;

type FilterKey = (typeof FILTER_OPTIONS)[number]['key'];

const matchesFilter = (status: string, filter: FilterKey) => {
  switch (filter) {
    case 'active':
      return ['placed', 'confirmed', 'shipped', 'out_for_delivery'].includes(status);
    case 'delivered':
      return status === 'delivered';
    case 'cancelled':
      return status === 'cancelled';
    case 'returns':
      return [
        'return_requested',
        'return_approved',
        'return_picked_up',
        'return_rejected',
        'refund_processed',
      ].includes(status);
  }
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`*, order_items (*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;

        const transformed: Order[] = (data || []).map((order: any) => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          subtotal: Number(order.subtotal),
          shipping_cost: Number(order.shipping_cost),
          total: Number(order.total),
          shipping_address: order.shipping_address as ShippingAddress,
          invoice_url: order.invoice_url,
          delivered_at: order.delivered_at,
          refund_amount: order.refund_amount != null ? Number(order.refund_amount) : null,
          refund_eta: order.refund_eta ?? null,
          refund_processed_at: order.refund_processed_at ?? null,
          created_at: order.created_at,
          tracking_awb: order.tracking_awb ?? null,
          order_items: order.order_items as OrderItem[],
        }));
        setOrders(transformed);
      } catch (err) {
        console.error('Error fetching orders:', err);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  // Flatten orders → one row per item (Meesho-style list)
  const allRows: OrderItemRow[] = useMemo(
    () =>
      orders.flatMap((order) =>
        (order.order_items || []).map((item) => ({ order, item })),
      ),
    [orders],
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allRows.filter(({ order, item }) => {
      if (activeFilters.size > 0) {
        const match = Array.from(activeFilters).some((f) => matchesFilter(order.status, f));
        if (!match) return false;
      }
      if (!q) return true;
      return (
        order.order_number.toLowerCase().includes(q) ||
        item.product_name.toLowerCase().includes(q) ||
        order.status.replace(/_/g, ' ').toLowerCase().includes(q) ||
        (order.tracking_awb || '').toLowerCase().includes(q)
      );
    });
  }, [allRows, searchQuery, activeFilters]);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="font-serif text-2xl font-bold tracking-tight mb-4 uppercase">My Orders</h1>

        {/* Search + Filter row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-full bg-secondary/40"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-11 px-3 text-primary hover:text-primary hover:bg-primary/5 gap-2"
              >
                <Filter size={16} />
                <span className="font-medium">
                  Filters{activeFilters.size > 0 ? ` (${activeFilters.size})` : ''}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {FILTER_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.key}
                  checked={activeFilters.has(opt.key)}
                  onCheckedChange={() => toggleFilter(opt.key)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
              {activeFilters.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    type="button"
                    onClick={() => setActiveFilters(new Set())}
                    className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Empty state */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">
              {searchQuery || activeFilters.size > 0 ? 'No matching orders' : 'No orders yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || activeFilters.size > 0
                ? 'Try a different search or clear filters'
                : 'Start shopping to see your orders here'}
            </p>
            {!searchQuery && activeFilters.size === 0 && (
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border border-y border-border bg-card rounded-lg overflow-hidden">
            {filteredRows.map(({ order, item }) => {
              const headline = getHeadline(order, formatPrice);
              const tone = toneClasses[headline.tone];
              return (
                <li key={`${order.id}-${item.id}`}>
                  <Link
                    to={`/track-order?id=${order.order_number}`}
                    className="flex items-center gap-3 p-4 hover:bg-secondary/30 active:bg-secondary/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-24 flex-shrink-0 rounded-md overflow-hidden bg-secondary">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-snug ${tone}`}>{headline.label}</p>
                      {headline.sub ? (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {headline.sub}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-foreground line-clamp-1 mt-0.5">
                          {item.product_name}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span>Size: {item.size || 'Free Size'}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50 inline-block" />
                        <span>Qty: {item.quantity}</span>
                      </p>

                      {/* Status-specific helper chip */}
                      {order.status === 'refund_processed' && order.refund_processed_at && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-success font-medium">
                          <CreditCard size={12} />
                          <span>Refund credited to source</span>
                        </div>
                      )}
                      {order.status === 'cancelled' && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                          <XCircle size={12} />
                          <span>Order #{order.order_number}</span>
                        </div>
                      )}
                      {order.status === 'shipped' && order.tracking_awb && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-primary font-medium">
                          <Truck size={12} />
                          <span className="font-mono truncate">{order.tracking_awb}</span>
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer hint */}
        {filteredRows.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Tap any order to track, cancel, return or download invoice.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrderHistory;
