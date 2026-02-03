import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Clock,
  Search,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockOrders } from '@/data/user';

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [searchQuery, setSearchQuery] = useState(orderId || '');
  const [order, setOrder] = useState(
    orderId ? mockOrders.find((o) => o.orderNumber === orderId) : null
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = mockOrders.find(
      (o) =>
        o.orderNumber.toLowerCase() === searchQuery.toLowerCase() ||
        o.trackingId?.toLowerCase() === searchQuery.toLowerCase()
    );
    setOrder(found || null);
  };

  const trackingSteps = [
    {
      id: 'placed',
      label: 'Order Placed',
      icon: Package,
      description: 'Your order has been placed successfully',
    },
    {
      id: 'confirmed',
      label: 'Order Confirmed',
      icon: CheckCircle2,
      description: 'Seller has confirmed your order',
    },
    {
      id: 'shipped',
      label: 'Shipped',
      icon: Truck,
      description: 'Your package is on its way',
    },
    {
      id: 'out_for_delivery',
      label: 'Out for Delivery',
      icon: MapPin,
      description: 'Package is out for delivery',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      icon: CheckCircle2,
      description: 'Package delivered successfully',
    },
  ];

  const getStepStatus = (stepId: string) => {
    if (!order) return 'pending';
    const statusOrder = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(stepId);
    
    if (order.status === 'cancelled') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">Track Your Order</h1>

        {/* Search Form */}
        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID or Tracking Number"
                className="pl-10"
              />
            </div>
            <Button type="submit">Track</Button>
          </form>
        </div>

        {order ? (
          <div className="max-w-3xl mx-auto">
            {/* Order Info */}
            <div className="bg-card p-6 rounded-lg border border-border mb-8">
              <div className="flex flex-wrap justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {new Date(order.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {order.trackingId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking ID</p>
                    <p className="font-semibold">{order.trackingId}</p>
                  </div>
                )}
                {order.estimatedDelivery && order.status !== 'delivered' && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Estimated Delivery
                    </p>
                    <p className="font-semibold flex items-center gap-1">
                      <Clock size={16} />
                      {new Date(order.estimatedDelivery).toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'long',
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Items Preview */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-16 h-20 bg-secondary rounded overflow-hidden"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Timeline */}
            {order.status === 'cancelled' ? (
              <div className="bg-destructive/10 p-6 rounded-lg text-center">
                <p className="text-destructive font-semibold text-lg">
                  Order Cancelled
                </p>
                <p className="text-muted-foreground mt-2">
                  This order has been cancelled. If you have any questions,
                  please contact support.
                </p>
              </div>
            ) : (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-semibold text-lg mb-6">Tracking Status</h2>
                <div className="relative">
                  {trackingSteps.map((step, index) => {
                    const status = getStepStatus(step.id);
                    const isLast = index === trackingSteps.length - 1;

                    return (
                      <div key={step.id} className="flex gap-4">
                        {/* Icon and Line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              status === 'completed'
                                ? 'bg-success text-success-foreground'
                                : status === 'current'
                                ? 'bg-primary text-primary-foreground animate-pulse'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            <step.icon size={20} />
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 h-12 ${
                                status === 'completed'
                                  ? 'bg-success'
                                  : 'bg-border'
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                          <h3
                            className={`font-semibold ${
                              status === 'pending'
                                ? 'text-muted-foreground'
                                : ''
                            }`}
                          >
                            {step.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                          {status === 'current' && (
                            <p className="text-xs text-primary mt-1">
                              Current Status
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="bg-card p-6 rounded-lg border border-border mt-8">
              <h2 className="font-semibold text-lg mb-4">Delivery Address</h2>
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.address}
                {order.shippingAddress.landmark &&
                  `, ${order.shippingAddress.landmark}`}
              </p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.pincode}
              </p>
              <p className="text-muted-foreground mt-2">
                Phone: {order.shippingAddress.phone}
              </p>
            </div>
          </div>
        ) : searchQuery && !orderId ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Order not found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find an order with that ID. Please check and try again.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Truck size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Track your shipment</h2>
            <p className="text-muted-foreground mb-4">
              Enter your order number or tracking ID to see the status
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrder;
