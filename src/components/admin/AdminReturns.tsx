import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Package, Search, Clock, Undo2, IndianRupee, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReturnOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total: number;
  payment_method: string;
  payment_status: string;
  shipping_address: any;
  return_reason: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  refund_amount: number | null;
  refund_eta: string | null;
  refund_processed_at: string | null;
  items: { product_name: string; quantity: number; price: number; size?: string; color?: string; image?: string }[];
}

interface AdminReturnsProps {
  orders: any[];
  onRefresh: () => void;
}

const RETURN_STATUSES = ['return_requested', 'return_approved', 'return_picked_up', 'refund_processed', 'return_rejected'];

const statusConfig: Record<string, { label: string; color: string }> = {
  return_requested: { label: 'Return Requested', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' },
  return_approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
  return_picked_up: { label: 'Picked Up', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' },
  refund_processed: { label: 'Refund Processed', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' },
  return_rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' },
};

const AdminReturns = ({ orders, onRefresh }: AdminReturnsProps) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [editRefundOrder, setEditRefundOrder] = useState<ReturnOrder | null>(null);
  const [editRefundAmount, setEditRefundAmount] = useState('');
  const [editRefundEta, setEditRefundEta] = useState('');
  const [savingRefund, setSavingRefund] = useState(false);

  // Sync edit form when opening
  useEffect(() => {
    if (editRefundOrder) {
      setEditRefundAmount(
        editRefundOrder.refund_amount != null ? String(editRefundOrder.refund_amount) : String(editRefundOrder.total)
      );
      setEditRefundEta(
        editRefundOrder.refund_eta
          ? new Date(editRefundOrder.refund_eta).toISOString().slice(0, 10)
          : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      );
    }
  }, [editRefundOrder]);

  const returnOrders: ReturnOrder[] = orders
    .filter((o: any) => RETURN_STATUSES.includes(o.status))
    .map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      user_id: o.user_id,
      status: o.status,
      total: o.total,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      shipping_address: o.shipping_address,
      return_reason: o.return_reason || null,
      created_at: o.created_at,
      updated_at: o.updated_at,
      delivered_at: o.delivered_at,
      refund_amount: o.refund_amount ?? null,
      refund_eta: o.refund_eta ?? null,
      refund_processed_at: o.refund_processed_at ?? null,
      items: o.items || [],
    }));

  const filtered = returnOrders.filter(o => {
    const matchesSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    all: returnOrders.length,
    return_requested: returnOrders.filter(o => o.status === 'return_requested').length,
    return_approved: returnOrders.filter(o => o.status === 'return_approved').length,
    return_picked_up: returnOrders.filter(o => o.status === 'return_picked_up').length,
    refund_processed: returnOrders.filter(o => o.status === 'refund_processed').length,
    return_rejected: returnOrders.filter(o => o.status === 'return_rejected').length,
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-order', {
        body: { orderId, status: newStatus },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Order status updated to ${statusConfig[newStatus]?.label || newStatus}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingOrderId) return;
    await updateStatus(rejectingOrderId, 'return_rejected');
    setShowRejectDialog(false);
    setRejectReason('');
    setRejectingOrderId(null);
  };

  const handleSaveRefund = async () => {
    if (!editRefundOrder) return;
    const amt = Number(editRefundAmount);
    if (Number.isNaN(amt) || amt < 0) {
      toast.error('Enter a valid refund amount');
      return;
    }
    if (amt > editRefundOrder.total) {
      toast.error(`Refund cannot exceed order total ₹${editRefundOrder.total}`);
      return;
    }
    if (!editRefundEta) {
      toast.error('Select a refund ETA');
      return;
    }
    setSavingRefund(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-order', {
        body: {
          orderId: editRefundOrder.id,
          refund_amount: amt,
          refund_eta: new Date(editRefundEta).toISOString(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Refund details updated');
      setEditRefundOrder(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update refund details');
    } finally {
      setSavingRefund(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{counts.all}</p>
            <p className="text-xs text-muted-foreground">Total Returns</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 dark:border-orange-800" onClick={() => setFilterStatus('return_requested')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{counts.return_requested}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 dark:border-blue-800" onClick={() => setFilterStatus('return_approved')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{counts.return_approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200 dark:border-green-800" onClick={() => setFilterStatus('refund_processed')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.refund_processed}</p>
            <p className="text-xs text-muted-foreground">Refunded</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200 dark:border-red-800" onClick={() => setFilterStatus('return_rejected')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{counts.return_rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order number or product name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[{ key: 'all', label: 'All' }, ...RETURN_STATUSES.map(s => ({ key: s, label: statusConfig[s].label }))].map(tab => (
          <Button
            key={tab.key}
            variant={filterStatus === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(tab.key)}
          >
            {tab.label} ({counts[tab.key as keyof typeof counts] || 0})
          </Button>
        ))}
      </div>

      {/* Return Orders List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Undo2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No return requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-mono font-semibold text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <Badge variant="outline" className={statusConfig[order.status]?.color || ''}>
                    {statusConfig[order.status]?.label || order.status}
                  </Badge>
                </div>

                {/* Return Reason */}
                {order.return_reason && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-3 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Return Reason</p>
                    <p className="text-sm">{order.return_reason}</p>
                  </div>
                )}

                {/* Items */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-shrink-0 bg-secondary/50 rounded-lg px-3 py-2">
                      {item.image && (
                        <img src={item.image} alt={item.product_name} className="w-10 h-12 object-cover rounded" />
                      )}
                      <div className="text-xs">
                        <p className="font-medium line-clamp-1">{item.product_name}</p>
                        <p className="text-muted-foreground">
                          Qty: {item.quantity} · ₹{item.price}
                          {item.size ? ` · ${item.size}` : ''}
                          {item.color ? ` · ${item.color}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Refund summary (when applicable) */}
                {(order.status === 'return_approved' || order.status === 'return_picked_up' || order.status === 'refund_processed') && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <IndianRupee size={12} />
                        Refund: ₹{(order.refund_amount ?? order.total).toLocaleString()}
                      </span>
                      {order.status !== 'refund_processed' && order.refund_eta && (
                        <span className="text-muted-foreground">
                          ETA: {formatDate(order.refund_eta)}
                        </span>
                      )}
                      {order.status === 'refund_processed' && order.refund_processed_at && (
                        <span className="text-muted-foreground">
                          Refunded: {formatDate(order.refund_processed_at)}
                        </span>
                      )}
                    </div>
                    {order.status !== 'refund_processed' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditRefundOrder(order)}>
                        <Pencil size={12} className="mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total:</span>{' '}
                    <span className="font-semibold">₹{order.total.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-3">Payment:</span>{' '}
                    <span className="capitalize">{order.payment_method}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      Details
                    </Button>

                    {order.status === 'return_requested' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, 'return_approved')}
                          disabled={updating === order.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {updating === order.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle2 size={14} className="mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setRejectingOrderId(order.id); setShowRejectDialog(true); }}
                          disabled={updating === order.id}
                        >
                          <XCircle size={14} className="mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {order.status === 'return_approved' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, 'return_picked_up')}
                        disabled={updating === order.id}
                      >
                        {updating === order.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <Package size={14} className="mr-1" />}
                        Mark Picked Up
                      </Button>
                    )}

                    {order.status === 'return_picked_up' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => updateStatus(order.id, 'refund_processed')}
                        disabled={updating === order.id}
                      >
                        {updating === order.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle2 size={14} className="mr-1" />}
                        Process Refund
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return Details — {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>Review the return request details below</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusConfig[selectedOrder.status]?.color || ''}>
                    {statusConfig[selectedOrder.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">₹{selectedOrder.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="capitalize">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivered At</p>
                  <p>{selectedOrder.delivered_at ? formatDate(selectedOrder.delivered_at) : 'N/A'}</p>
                </div>
              </div>

              {selectedOrder.return_reason && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Customer's Return Reason</p>
                  <p className="text-sm">{selectedOrder.return_reason}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-2">
                      {item.image && (
                        <img src={item.image} alt={item.product_name} className="w-12 h-14 object-cover rounded" />
                      )}
                      <div className="text-sm flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} · ₹{item.price}
                          {item.size ? ` · Size: ${item.size}` : ''}
                          {item.color ? ` · Color: ${item.color}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-sm font-medium mb-1">Shipping Address</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.shipping_address.firstName} {selectedOrder.shipping_address.lastName},
                    {' '}{selectedOrder.shipping_address.address},
                    {' '}{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} — {selectedOrder.shipping_address.pincode}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Return Request</DialogTitle>
            <DialogDescription>Are you sure you want to reject this return request?</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional: Add a reason for rejection..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={updating === rejectingOrderId}>
              {updating === rejectingOrderId ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Reject Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Refund Dialog */}
      <Dialog open={!!editRefundOrder} onOpenChange={(open) => !open && setEditRefundOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Refund Details</DialogTitle>
            <DialogDescription>
              {editRefundOrder ? `Order ${editRefundOrder.order_number} · Total ₹${editRefundOrder.total.toLocaleString()}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount (₹)</Label>
              <Input
                id="refund-amount"
                type="number"
                min={0}
                step="0.01"
                max={editRefundOrder?.total ?? undefined}
                value={editRefundAmount}
                onChange={e => setEditRefundAmount(e.target.value)}
                placeholder="Refund amount"
              />
              <p className="text-xs text-muted-foreground">
                Use a partial amount if the customer is being partially refunded. Cannot exceed order total.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-eta">Estimated Refund By</Label>
              <Input
                id="refund-eta"
                type="date"
                value={editRefundEta}
                onChange={e => setEditRefundEta(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
              <p className="text-xs text-muted-foreground">
                Customer will see this date as the expected refund arrival.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRefundOrder(null)} disabled={savingRefund}>
              Cancel
            </Button>
            <Button onClick={handleSaveRefund} disabled={savingRefund}>
              {savingRefund ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Save Refund Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReturns;
