import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, Package, Search, Calendar, Copy, Check, Eye, ArrowLeft, MapPin } from 'lucide-react';
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

interface CustomerAddress {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
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
  addresses?: CustomerAddress[];
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
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

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

  // Detail view for a single customer
  if (viewingCustomer) {
    const c = viewingCustomer;
    const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || 'Customer';

    return (
      <div>
        <button
          onClick={() => setViewingCustomer(null)}
          className="flex items-center gap-2 text-sm text-primary hover:underline mb-4"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0">
            {(c.first_name?.[0] || c.email?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">{name}</h2>
            <p className="text-sm text-muted-foreground">{c.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Customer ID</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono truncate flex-1">{c.id}</code>
              <button onClick={() => copyId(c.id)} className="p-1 hover:bg-muted rounded">
                {copiedId === c.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Phone</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {c.phone || 'Not provided'}
            </p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Registered On</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {formatDate(c.created_at)}
            </p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Spent</p>
            <p className="text-sm font-bold">₹{c.total_spent.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground">{c.total_orders} order(s)</p>
          </CardContent></Card>
        </div>

        {/* Addresses Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
            <MapPin className="h-4 w-4" /> Saved Addresses ({c.addresses?.length || 0})
          </h3>
          {c.addresses && c.addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {c.addresses.map((addr) => (
                <Card key={addr.id} className={`border ${addr.is_default ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{addr.full_name}</span>
                      {addr.is_default && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">Default</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{addr.phone}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {addr.address}{addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">
              No saved addresses
            </CardContent></Card>
          )}
        </div>

        {/* Orders Section */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
            <Package className="h-4 w-4" /> Orders ({c.orders?.length || 0})
          </h3>
          {c.orders && c.orders.length > 0 ? (
            <div className="space-y-3">
              {c.orders.map((order) => (
                <Card key={order.id} className="border border-border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-mono font-medium">#{order.order_number}</span>
                        <span className="text-xs text-muted-foreground ml-2">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${statusColor(order.status)}`}>{order.status}</Badge>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">
              No orders placed yet
            </CardContent></Card>
          )}
        </div>
      </div>
    );
  }

  // List view
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
        <div className="space-y-2">
          {filtered.map((c) => {
            const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || 'Customer';
            return (
              <Card key={c.id} className="border border-border/50">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(c.first_name?.[0] || c.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">{c.total_orders} order(s) · ₹{c.total_spent.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 flex-shrink-0"
                      onClick={() => setViewingCustomer(c)}
                    >
                      <Eye size={14} />
                      View
                    </Button>
                  </div>
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
