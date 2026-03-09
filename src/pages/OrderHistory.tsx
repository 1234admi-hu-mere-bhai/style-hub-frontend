import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, FileText, Loader2, Eye, ChevronRight, RefreshCw, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  created_at: string;
  order_items: OrderItem[];
}

const isWithin7Days = (deliveredAt: string | null) => {
  if (!deliveredAt) return true;
  const days = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingReplacement, setRequestingReplacement] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRequestReplacement = async (orderId: string) => {
    setRequestingReplacement(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('request-replacement', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Replacement request submitted successfully');
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'replacement_requested' } : o));
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit replacement request');
    } finally {
      setRequestingReplacement(null);
    }
  };

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
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform data to match our interface
        const transformedOrders: Order[] = (data || []).map((order) => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          subtotal: Number(order.subtotal),
          shipping_cost: Number(order.shipping_cost),
          total: Number(order.total),
          shipping_address: order.shipping_address as unknown as ShippingAddress,
          invoice_url: order.invoice_url,
          delivered_at: order.delivered_at,
          created_at: order.created_at,
          order_items: order.order_items as unknown as OrderItem[],
        }));
        
        setOrders(transformedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-success/10 text-success border-success/20';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">Order History</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-lg border border-border p-6"
              >
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-semibold font-mono">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-semibold">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-16 h-20 bg-secondary rounded overflow-hidden"
                    >
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/track-order?id=${order.order_number}`}>
                      <Eye size={16} className="mr-2" />
                      Track Order
                    </Link>
                  </Button>
                  {order.invoice_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                        <FileText size={16} className="mr-2" />
                        Download Invoice
                      </a>
                    </Button>
                  )}
                  {order.status === 'delivered' && isWithin7Days(order.delivered_at) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      onClick={() => handleRequestReplacement(order.id)}
                      disabled={requestingReplacement === order.id}
                    >
                      {requestingReplacement === order.id ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : (
                        <RefreshCw size={16} className="mr-2" />
                      )}
                      Request Replacement
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild className="ml-auto">
                    <Link to={`/track-order?id=${order.order_number}`}>
                      View Details
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrderHistory;
