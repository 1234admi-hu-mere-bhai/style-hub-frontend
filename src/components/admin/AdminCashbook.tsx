import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  Download,
  Search,
  TrendingUp,
  Wallet,
  MapPin,
  CreditCard,
  Receipt,
  User,
  Hash,
  Calendar,
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  cod_fee?: number;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  status: string;
  created_at: string;
  refund_amount?: number | null;
  refund_processed_at?: string | null;
  shipping_address?: any;
}

interface AdminCashbookProps {
  orders: Order[];
}

type Entry = {
  id: string;
  orderId: string;
  date: Date;
  type: 'IN' | 'OUT';
  amount: number;
  title: string;
  subtitle: string;
  method: string;
  orderNumber: string;
  status: string;
  customer: string;
};

const formatINR = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN');

const formatDateLabel = (d: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const AdminCashbook = ({ orders }: AdminCashbookProps) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const [period, setPeriod] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [selected, setSelected] = useState<{ entry: Entry; order: Order } | null>(null);

  // Build cashbook entries: paid orders = IN, refunds = OUT
  const allEntries: Entry[] = useMemo(() => {
    const items: Entry[] = [];
    for (const o of orders) {
      const addr = o.shipping_address || {};
      const customer =
        [addr.firstName, addr.lastName].filter(Boolean).join(' ') ||
        addr.full_name ||
        'Customer';

      // SALE (IN) — only for paid orders
      if (o.payment_status === 'paid' || o.payment_status === 'cod_paid') {
        items.push({
          id: `${o.id}-in`,
          orderId: o.id,
          date: new Date(o.created_at),
          type: 'IN',
          amount: Number(o.total),
          title: `Sale · ${customer}`,
          subtitle: `Order ${o.order_number}`,
          method: o.payment_method || '—',
          orderNumber: o.order_number,
          status: o.status,
          customer,
        });
      }

      // REFUND (OUT)
      if (o.refund_processed_at && o.refund_amount && Number(o.refund_amount) > 0) {
        items.push({
          id: `${o.id}-out`,
          orderId: o.id,
          date: new Date(o.refund_processed_at),
          type: 'OUT',
          amount: Number(o.refund_amount),
          title: `Refund · ${customer}`,
          subtitle: `Order ${o.order_number}`,
          method: o.payment_method || '—',
          orderNumber: o.order_number,
          status: 'refunded',
          customer,
        });
      }
    }
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    let list = allEntries;
    if (filter === 'in') list = list.filter((e) => e.type === 'IN');
    if (filter === 'out') list = list.filter((e) => e.type === 'OUT');
    if (period !== 'all') {
      const now = Date.now();
      const cutoff =
        period === 'today'
          ? new Date().setHours(0, 0, 0, 0)
          : period === '7d'
          ? now - 7 * 86400000
          : now - 30 * 86400000;
      list = list.filter((e) => e.date.getTime() >= cutoff);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.orderNumber.toLowerCase().includes(s) ||
          e.customer.toLowerCase().includes(s) ||
          e.method.toLowerCase().includes(s),
      );
    }
    return list;
  }, [allEntries, filter, period, search]);

  // Totals
  const totals = useMemo(() => {
    const cashIn = filteredEntries
      .filter((e) => e.type === 'IN')
      .reduce((s, e) => s + e.amount, 0);
    const cashOut = filteredEntries
      .filter((e) => e.type === 'OUT')
      .reduce((s, e) => s + e.amount, 0);
    return { cashIn, cashOut, balance: cashIn - cashOut };
  }, [filteredEntries]);

  // Group by date for cashbook-style sections
  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of filteredEntries) {
      const key = formatDateLabel(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [filteredEntries]);

  const handleExportCSV = () => {
    const header = [
      'Date',
      'Time',
      'Type',
      'Amount (INR)',
      'Order #',
      'Customer',
      'Payment Method',
      'Status',
    ];
    const rows = filteredEntries.map((e) => [
      e.date.toLocaleDateString('en-IN'),
      formatTime(e.date),
      e.type === 'IN' ? 'Cash In' : 'Cash Out',
      String(Math.round(e.amount)),
      e.orderNumber,
      e.customer,
      e.method,
      e.status,
    ]);
    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashbook-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-2xl font-bold">Cashbook</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-1.5"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Balance hero card — cashbook style */}
      <Card className="mb-4 border-0 overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
              <Wallet className="h-3.5 w-3.5" />
              Net Balance
            </div>
            <TrendingUp className="h-4 w-4 opacity-80" />
          </div>
          <p className="text-4xl font-bold tracking-tight">
            {formatINR(totals.balance)}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/20">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-90 mb-0.5">
                <ArrowDownCircle className="h-3 w-3" />
                Cash In
              </div>
              <p className="text-lg font-bold">{formatINR(totals.cashIn)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-90 mb-0.5">
                <ArrowUpCircle className="h-3 w-3" />
                Cash Out
              </div>
              <p className="text-lg font-bold">{formatINR(totals.cashOut)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, method"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['all', 'today', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {p === 'all' ? 'All time' : p === 'today' ? 'Today' : `Last ${p}`}
            </button>
          ))}
          <div className="ml-auto flex gap-1.5">
            {(['all', 'in', 'out'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? f === 'in'
                      ? 'bg-green-600 text-white'
                      : f === 'out'
                      ? 'bg-red-600 text-white'
                      : 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {f === 'all' ? 'All' : f === 'in' ? 'In' : 'Out'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entries grouped by date */}
      {grouped.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No cashbook entries yet</p>
            <p className="text-xs mt-1">Paid sales and refunds will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(([dateLabel, entries]) => {
            const dayIn = entries
              .filter((e) => e.type === 'IN')
              .reduce((s, e) => s + e.amount, 0);
            const dayOut = entries
              .filter((e) => e.type === 'OUT')
              .reduce((s, e) => s + e.amount, 0);
            return (
              <div key={dateLabel}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {dateLabel}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Net{' '}
                    <span
                      className={
                        dayIn - dayOut >= 0
                          ? 'text-green-700'
                          : 'text-red-700'
                      }
                    >
                      {formatINR(dayIn - dayOut)}
                    </span>
                  </p>
                </div>
                <Card className="border border-border/50 overflow-hidden">
                  <div className="divide-y divide-border/50">
                    {entries.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          const ord = orders.find((o) => o.id === e.orderId);
                          if (ord) setSelected({ entry: e, order: ord });
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
                      >
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            e.type === 'IN'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {e.type === 'IN' ? (
                            <ArrowDownCircle className="h-5 w-5" />
                          ) : (
                            <ArrowUpCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {e.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {e.orderNumber}
                            </span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatTime(e.date)}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1.5 font-normal"
                            >
                              {e.method}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-sm font-bold ${
                              e.type === 'IN'
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}
                          >
                            {e.type === 'IN' ? '+' : '−'}
                            {formatINR(e.amount)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selected.entry.type === 'IN'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selected.entry.type === 'IN' ? (
                      <ArrowDownCircle className="h-6 w-6" />
                    ) : (
                      <ArrowUpCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-base">
                      {selected.entry.type === 'IN' ? 'Sale Received' : 'Refund Issued'}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {formatDateLabel(selected.entry.date)} · {formatTime(selected.entry.date)}
                    </DialogDescription>
                  </div>
                </div>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    selected.entry.type === 'IN' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {selected.entry.type === 'IN' ? '+' : '−'}
                  {formatINR(selected.entry.amount)}
                </p>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Order info */}
                <div className="rounded-lg border border-border/60 p-3 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Order
                  </p>
                  <Row icon={<Hash className="h-3.5 w-3.5" />} label="Order #" value={selected.order.order_number} mono />
                  <Row icon={<User className="h-3.5 w-3.5" />} label="Customer" value={selected.entry.customer} />
                  <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Placed" value={new Date(selected.order.created_at).toLocaleString('en-IN')} />
                  <Row
                    icon={<Receipt className="h-3.5 w-3.5" />}
                    label="Status"
                    value={<Badge variant="outline" className="capitalize text-[10px]">{selected.order.status.replace(/_/g, ' ')}</Badge>}
                  />
                </div>

                {/* Payment / refund metadata */}
                <div className="rounded-lg border border-border/60 p-3 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {selected.entry.type === 'IN' ? 'Payment' : 'Refund'}
                  </p>
                  <Row icon={<CreditCard className="h-3.5 w-3.5" />} label="Method" value={selected.order.payment_method || '—'} />
                  <Row
                    label="Payment status"
                    value={<Badge variant="outline" className="capitalize text-[10px]">{selected.order.payment_status.replace(/_/g, ' ')}</Badge>}
                  />
                  {selected.order.payment_id && (
                    <Row label="Txn ID" value={selected.order.payment_id} mono />
                  )}
                  {selected.entry.type === 'OUT' && selected.order.refund_processed_at && (
                    <Row label="Refunded at" value={new Date(selected.order.refund_processed_at).toLocaleString('en-IN')} />
                  )}
                </div>

                {/* Amount breakdown */}
                <div className="rounded-lg border border-border/60 p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Amount Breakdown
                  </p>
                  {selected.order.subtotal !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatINR(Number(selected.order.subtotal))}</span>
                    </div>
                  )}
                  {selected.order.shipping_cost !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{formatINR(Number(selected.order.shipping_cost))}</span>
                    </div>
                  )}
                  {selected.order.cod_fee !== undefined && Number(selected.order.cod_fee) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">COD fee</span>
                      <span>{formatINR(Number(selected.order.cod_fee))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border/50">
                    <span>Order total</span>
                    <span>{formatINR(Number(selected.order.total))}</span>
                  </div>
                  {selected.entry.type === 'OUT' && selected.order.refund_amount != null && (
                    <div className="flex justify-between text-sm font-bold text-red-700 pt-1">
                      <span>Refund amount</span>
                      <span>−{formatINR(Number(selected.order.refund_amount))}</span>
                    </div>
                  )}
                </div>

                {/* Shipping address */}
                {selected.order.shipping_address && (
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Shipping address
                    </p>
                    <p className="text-xs leading-relaxed">
                      {[
                        selected.order.shipping_address.firstName,
                        selected.order.shipping_address.lastName,
                      ].filter(Boolean).join(' ') || selected.order.shipping_address.full_name}
                      <br />
                      {selected.order.shipping_address.address}
                      {selected.order.shipping_address.landmark && `, ${selected.order.shipping_address.landmark}`}
                      <br />
                      {selected.order.shipping_address.city}, {selected.order.shipping_address.state} - {selected.order.shipping_address.pincode}
                      <br />
                      <span className="text-muted-foreground">📞 {selected.order.shipping_address.phone}</span>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCashbook;
