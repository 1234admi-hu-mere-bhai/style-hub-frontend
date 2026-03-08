import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, ChevronDown, ChevronUp, Mail, Phone, Package, Search, Calendar, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string | null;
  orders?: CustomerOrder[];
}

interface AdminCustomersProps {
  customers: Customer[];
}

const statusColor = (s: string) => {
  switch (s) {
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'shipped': return 'bg-blue-100 text-blue-800';
    case 'confirmed': return 'bg-indigo-100 text-indigo-800';
    case 'pending': case 'placed': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-muted text-muted-foreground';
  }
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const AdminCustomers = ({ customers }: AdminCustomersProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Customer ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.email?.toLowerCase().includes(q) ||
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const totalSpentAll = customers.reduce((s, c) => s + c.total_spent, 0);
  const totalOrdersAll = customers.reduce((s, c) => s + c.total_orders, 0);

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold mb-4">Customers ({customers.length})</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{customers.length}</p>
          <p className="text-xs text-muted-foreground">Total Registered</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{customers.filter(c => c.total_orders > 0).length}</p>
          <p className="text-xs text-muted-foreground">With Orders</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{totalOrdersAll}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">₹{totalSpentAll.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{search ? 'No customers match your search' : 'No customers registered yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || 'Customer';

            return (
              <Card key={c.id} className="border border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Customer Header */}
                  <button
                    onClick={() => toggle(c.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(c.first_name?.[0] || c.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {c.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold">₹{c.total_spent.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">{c.total_orders} order(s)</p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                      {/* Customer Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-card rounded-lg border border-border p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Customer ID</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono truncate flex-1">{c.id}</code>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyId(c.id); }}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {copiedId === c.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                            </button>
                          </div>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Registered On</p>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(c.created_at)}
                          </p>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Spent</p>
                          <p className="text-sm font-bold">₹{c.total_spent.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Last Order</p>
                          <p className="text-sm font-medium">
                            {c.last_order_at ? formatDate(c.last_order_at) : 'No orders yet'}
                          </p>
                        </div>
                      </div>

                      {/* Orders */}
                      {c.orders && c.orders.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" /> Orders ({c.orders.length})
                          </p>
                          {c.orders.map((order) => (
                            <div key={order.id} className="bg-card rounded-lg border border-border p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-mono font-medium">#{order.order_number}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatDate(order.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[10px] ${statusColor(order.status)}`}>
                                    {order.status}
                                  </Badge>
                                  <span className="text-sm font-bold">₹{Number(order.total).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                      {item.product_name}
                                      {item.size && ` · ${item.size}`}
                                      {item.color && ` · ${item.color}`}
                                    </span>
                                    <span>×{item.quantity} · ₹{Number(item.price).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">No orders placed yet</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
