import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Eye, Package, Truck, Loader2 } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  product_id: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  tracking_awb?: string | null;
  items: OrderItem[];
}

interface AdminOrdersProps {
  orders: Order[];
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-yellow-100 text-yellow-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  replacement_requested: 'bg-purple-100 text-purple-800',
  replacement_shipped: 'bg-amber-100 text-amber-800',
  replacement_delivered: 'bg-teal-100 text-teal-800',
  pending: 'bg-muted text-muted-foreground',
};

const ORDER_STATUSES = ['pending', 'placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'replacement_requested', 'replacement_shipped', 'replacement_delivered'];

const AdminOrders = ({ orders, onRefresh }: AdminOrdersProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [shipmentWeight, setShipmentWeight] = useState('0.5');
  const [pickupName, setPickupName] = useState('Muffigout Warehouse');
  const [manualAwb, setManualAwb] = useState('');
  const [savingAwb, setSavingAwb] = useState(false);

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase.functions.invoke('admin-update-order', {
        body: { orderId, status: newStatus },
      });
      if (error) throw error;
      toast({ title: 'Order updated', description: `Status changed to ${newStatus}` });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const createDelhiveryShipment = async (order: Order) => {
    setCreatingShipment(true);
    try {
      const addr = order.shipping_address;
      const shipmentData = {
        name: `${addr?.firstName || ''} ${addr?.lastName || ''}`.trim(),
        add: addr?.address || '',
        pin: addr?.pincode || '',
        city: addr?.city || '',
        state: addr?.state || '',
        country: 'India',
        phone: addr?.phone || '',
        order: order.order_number,
        payment_mode: order.payment_method === 'COD' ? 'COD' : 'Prepaid',
        total_amount: order.total,
        cod_amount: order.payment_method === 'COD' ? order.total : 0,
        weight: parseFloat(shipmentWeight) * 1000, // kg to grams
        pickup_location: { name: pickupName },
        products_desc: order.items.map(i => i.product_name).join(', '),
        quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
      };

      const { data, error } = await supabase.functions.invoke('delhivery', {
        body: { action: 'create_shipment', orderId: order.id, shipmentData },
      });

      if (error) throw error;

      toast({
        title: 'Shipment created!',
        description: data?.awb ? `AWB: ${data.awb}` : 'Shipment booked on Delhivery',
      });
      onRefresh();
      setSelectedOrder(null);
    } catch (err: any) {
      toast({ title: 'Shipment creation failed', description: err.message, variant: 'destructive' });
    } finally {
      setCreatingShipment(false);
    }
  };

  const saveManualAwb = async (orderId: string) => {
    const awb = manualAwb.trim();
    if (!awb) {
      toast({ title: 'Enter an AWB number', variant: 'destructive' });
      return;
    }
    setSavingAwb(true);
    try {
      const { error } = await supabase.functions.invoke('admin-update-order', {
        body: { orderId, tracking_awb: awb, status: 'shipped' },
      });
      if (error) throw error;
      toast({ title: 'AWB saved', description: `Tracking number ${awb} added to order` });
      setManualAwb('');
      onRefresh();
      setSelectedOrder(null);
    } catch (err: any) {
      toast({ title: 'Failed to save AWB', description: err.message, variant: 'destructive' });
    } finally {
      setSavingAwb(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Orders ({orders.length})</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {ORDER_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">{order.order_number}</span>
                      <Badge variant="secondary" className={STATUS_COLORS[order.status] || ''}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{order.items.length} item(s) · {order.payment_method}
                    </p>
                    <p className="text-lg font-bold mt-1">₹{Number(order.total).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick status update */}
                <div className="mt-3 flex items-center gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(val) => updateStatus(order.id, val)}
                    disabled={updatingId === order.id}
                  >
                    <SelectTrigger className="h-8 text-xs w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-[10px]">{order.payment_status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary" className={STATUS_COLORS[selectedOrder.status] || ''}>
                  {selectedOrder.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>{item.product_name} × {item.quantity} {item.size && `(${item.size})`} {item.color && `[${item.color}]`}</span>
                    <span>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(selectedOrder.subtotal).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>₹{Number(selectedOrder.shipping_cost).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{Number(selectedOrder.total).toLocaleString('en-IN')}</span></div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-1">Shipping Address</p>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.shipping_address?.firstName} {selectedOrder.shipping_address?.lastName}<br />
                  {selectedOrder.shipping_address?.address}<br />
                  {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}<br />
                  📞 {selectedOrder.shipping_address?.phone}
                </p>
              </div>
              {/* Delhivery Shipment */}
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Delhivery Shipment</p>
                {selectedOrder.tracking_awb ? (
                  <div>
                    <Badge variant="default" className="mb-2">AWB: {selectedOrder.tracking_awb}</Badge>
                    <p className="text-xs text-muted-foreground">Shipment already created</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Weight (kg)"
                        value={shipmentWeight}
                        onChange={(e) => setShipmentWeight(e.target.value)}
                        className="w-24 h-8 text-xs"
                        type="number"
                        step="0.1"
                        min="0.1"
                      />
                      <Input
                        placeholder="Pickup location name"
                        value={pickupName}
                        onChange={(e) => setPickupName(e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => createDelhiveryShipment(selectedOrder)}
                      disabled={creatingShipment}
                    >
                      {creatingShipment ? (
                        <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Creating...</>
                      ) : (
                        <><Truck className="h-3 w-3 mr-1" /> Create Delhivery Shipment</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
