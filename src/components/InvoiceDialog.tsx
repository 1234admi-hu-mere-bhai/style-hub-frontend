import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Loader2,
  Download,
  Printer,
  FileText,
  RefreshCw,
  ChevronDown,
  Package,
  MapPin,
  Receipt,
  CheckCircle2,
  Calendar,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface InvoiceItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  image: string | null;
}

interface InvoiceAddress {
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

interface InvoiceOrder {
  id: string;
  order_number: string;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  shipping_address: InvoiceAddress;
  order_items: InvoiceItem[];
}

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  invoiceUrl: string | null;
  onGenerated?: (invoiceUrl: string) => void;
}

const InvoiceDialog = ({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  invoiceUrl,
  onGenerated,
}: InvoiceDialogProps) => {
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasInvoice, setHasInvoice] = useState(!!invoiceUrl);

  // Section open state — items expanded by default for visibility
  const [openSummary, setOpenSummary] = useState(true);
  const [openItems, setOpenItems] = useState(true);
  const [openAddress, setOpenAddress] = useState(false);
  const [openTotals, setOpenTotals] = useState(true);

  useEffect(() => {
    setHasInvoice(!!invoiceUrl);
  }, [invoiceUrl]);

  // Fetch order details for the styled invoice
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();
      if (!cancelled) {
        if (error || !data) {
          toast.error('Could not load invoice details');
          setOrder(null);
        } else {
          setOrder({
            id: data.id,
            order_number: data.order_number,
            payment_method: data.payment_method,
            payment_status: data.payment_status,
            payment_id: data.payment_id,
            subtotal: Number(data.subtotal),
            shipping_cost: Number(data.shipping_cost),
            total: Number(data.total),
            created_at: data.created_at,
            shipping_address: data.shipping_address as unknown as InvoiceAddress,
            order_items: (data.order_items as unknown as InvoiceItem[]) || [],
          });
        }
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  // Auto-trigger AI invoice generation if missing
  useEffect(() => {
    if (open && order && !hasInvoice && !isGenerating) {
      generateNow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order]);

  const generateNow = async (silent = false) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const text = (data as any)?.invoice as string | undefined;
      if (text) {
        const newUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
        setHasInvoice(true);
        onGenerated?.(newUrl);
        if (!silent) toast.success('Invoice generated');
      }
    } catch (err: any) {
      if (!silent) toast.error(err.message || 'Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const buildInvoiceHtml = () => {
    if (!order) return '';
    const addr = order.shipping_address;
    const date = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const itemsHtml = order.order_items
      .map(
        (it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>
            <strong>${it.product_name}</strong>
            ${it.size ? `<br/><span class="meta">Size: ${it.size}</span>` : ''}
            ${it.color ? `<span class="meta"> · Color: ${it.color}</span>` : ''}
          </td>
          <td class="num">${it.quantity}</td>
          <td class="num">₹${Number(it.price).toLocaleString('en-IN')}</td>
          <td class="num"><strong>₹${(Number(it.price) * it.quantity).toLocaleString('en-IN')}</strong></td>
        </tr>`
      )
      .join('');

    return `
      <html>
        <head>
          <title>Invoice ${order.order_number}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, 'Segoe UI', sans-serif; padding: 32px; color: #111; max-width: 720px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #7C3AED; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #7C3AED; }
            .tag { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .invoice-no { text-align: right; }
            .invoice-no h2 { margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .invoice-no p { margin: 4px 0 0; font-size: 18px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
            .card { background: #f8f7ff; border-radius: 8px; padding: 14px 16px; }
            .card h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: #7C3AED; letter-spacing: 1px; }
            .card p { margin: 2px 0; font-size: 13px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #7C3AED; color: white; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            th.num, td.num { text-align: right; }
            td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
            .meta { font-size: 11px; color: #888; }
            .totals { margin-left: auto; width: 320px; }
            .totals .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
            .totals .grand { border-top: 2px solid #111; margin-top: 8px; padding-top: 12px; font-size: 17px; font-weight: 800; color: #7C3AED; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
            .footer strong { color: #7C3AED; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">MUFFIGOUT APPAREL HUB</div>
              <div class="tag">Crafted with Trust · Worn with Pride</div>
            </div>
            <div class="invoice-no">
              <h2>Tax Invoice</h2>
              <p>${order.order_number}</p>
              <p style="font-size:12px; color:#666; font-weight:500;">${date}</p>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h3>Billed To</h3>
              <p><strong>${addr.firstName} ${addr.lastName}</strong></p>
              <p>${addr.address}${addr.landmark ? `, ${addr.landmark}` : ''}</p>
              <p>${addr.city}, ${addr.state} - ${addr.pincode}</p>
              ${addr.phone ? `<p>📞 ${addr.phone}</p>` : ''}
            </div>
            <div class="card">
              <h3>Payment</h3>
              <p><strong>Method:</strong> ${order.payment_method}</p>
              <p><strong>Status:</strong> ${order.payment_status === 'paid' ? '✓ Paid' : order.payment_status}</p>
              ${order.payment_id ? `<p><strong>Txn ID:</strong> ${order.payment_id}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th class="num">Qty</th>
                <th class="num">Price</th>
                <th class="num">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div class="totals">
            <div class="row"><span>Subtotal</span><span>₹${order.subtotal.toLocaleString('en-IN')}</span></div>
            <div class="row"><span>Shipping</span><span>${order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost.toLocaleString('en-IN')}`}</span></div>
            <div class="row grand"><span>Grand Total</span><span>₹${order.total.toLocaleString('en-IN')}</span></div>
          </div>

          <div class="footer">
            Thank you for shopping with <strong>MUFFIGOUT APPAREL HUB</strong>!<br/>
            For queries, contact support@muffigoutapparelhub.com · +91 91363 54192
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const html = buildInvoiceHtml();
    if (!html) return;
    const w = window.open('', '_blank', 'width=820,height=1000');
    if (!w) {
      toast.error('Please allow pop-ups to print the invoice');
      return;
    }
    w.document.write(html + `<script>window.onload = () => setTimeout(() => window.print(), 200);</script>`);
    w.document.close();
  };

  const handleDownload = () => {
    const html = buildInvoiceHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalSavings = order
    ? order.order_items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0) - order.subtotal
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] sm:w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header — gradient brand bar */}
        <DialogHeader className="px-5 pt-5 pb-4 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground border-b border-border space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/15 flex items-center justify-center flex-shrink-0 backdrop-blur">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold truncate text-primary-foreground">
                  Tax Invoice
                </DialogTitle>
                <p className="text-[11px] uppercase tracking-wider opacity-80 truncate">
                  {orderNumber}
                </p>
              </div>
            </div>
            {order?.payment_status === 'paid' && (
              <span className="inline-flex items-center gap-1 bg-success/20 border border-success/30 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0">
                <CheckCircle2 className="h-3 w-3" /> Paid
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable body — smooth scrolling, momentum on iOS */}
        <div
          className="flex-1 overflow-y-auto bg-background"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
        >
          {isLoading || !order ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading invoice...</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Brand strip */}
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-4 text-center">
                <p className="font-serif font-bold text-lg text-primary leading-tight">
                  MUFFIGOUT APPAREL HUB
                </p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                  Crafted with Trust · Worn with Pride
                </p>
              </div>

              {/* Summary Section */}
              <CollapsibleSection
                open={openSummary}
                onOpenChange={setOpenSummary}
                icon={<Calendar className="h-4 w-4" />}
                title="Order Summary"
                badge={new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              >
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Order ID</dt>
                    <dd className="font-mono font-semibold text-xs mt-0.5 break-all">{order.order_number}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Payment</dt>
                    <dd className="font-semibold text-xs mt-0.5 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {order.payment_method}
                    </dd>
                  </div>
                  {order.payment_id && (
                    <div className="col-span-2">
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Transaction ID</dt>
                      <dd className="font-mono text-xs mt-0.5 break-all">{order.payment_id}</dd>
                    </div>
                  )}
                </dl>
              </CollapsibleSection>

              {/* Items Section */}
              <CollapsibleSection
                open={openItems}
                onOpenChange={setOpenItems}
                icon={<Package className="h-4 w-4" />}
                title="Items"
                badge={`${order.order_items.length} item${order.order_items.length === 1 ? '' : 's'}`}
              >
                <ul className="divide-y divide-border -mx-1">
                  {order.order_items.map((it) => (
                    <li key={it.id} className="flex gap-3 px-1 py-3 first:pt-0 last:pb-0">
                      {it.image && (
                        <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0 border border-border">
                          <img src={it.image} alt={it.product_name} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight line-clamp-2">{it.product_name}</p>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                          {it.size && <span>Size: <strong className="text-foreground">{it.size}</strong></span>}
                          {it.color && <span>· Color: <strong className="text-foreground">{it.color}</strong></span>}
                          <span>· Qty: <strong className="text-foreground">{it.quantity}</strong></span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm">{formatPrice(Number(it.price) * it.quantity)}</p>
                        {it.quantity > 1 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatPrice(Number(it.price))} each
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>

              {/* Address Section */}
              <CollapsibleSection
                open={openAddress}
                onOpenChange={setOpenAddress}
                icon={<MapPin className="h-4 w-4" />}
                title="Billed To"
                badge={`${order.shipping_address.city}`}
              >
                <div className="text-sm space-y-1">
                  <p className="font-bold">
                    {order.shipping_address.firstName} {order.shipping_address.lastName}
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    {order.shipping_address.address}
                    {order.shipping_address.landmark && `, ${order.shipping_address.landmark}`}
                    <br />
                    {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                  </p>
                  {order.shipping_address.phone && (
                    <p className="text-xs pt-1">📞 {order.shipping_address.phone}</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Totals Section */}
              <CollapsibleSection
                open={openTotals}
                onOpenChange={setOpenTotals}
                icon={<Sparkles className="h-4 w-4" />}
                title="Bill Details"
                badge={formatPrice(order.total)}
                accent
              >
                <div className="space-y-2 text-sm">
                  <Row label="Subtotal" value={formatPrice(order.subtotal)} />
                  <Row
                    label="Shipping"
                    value={
                      order.shipping_cost === 0 ? (
                        <span className="text-success font-bold">FREE</span>
                      ) : (
                        formatPrice(order.shipping_cost)
                      )
                    }
                  />
                  {totalSavings > 0 && (
                    <Row
                      label="Discount"
                      value={<span className="text-success">− {formatPrice(totalSavings)}</span>}
                    />
                  )}
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent my-2" />
                  <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2.5 border border-primary/20">
                    <span className="font-bold text-base">Grand Total</span>
                    <span className="font-extrabold text-lg text-primary">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                  {totalSavings > 0 && (
                    <p className="text-center text-xs text-success font-semibold pt-1">
                      🎉 You saved {formatPrice(totalSavings)} on this order
                    </p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Generation status */}
              {isGenerating && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Finalizing AI invoice...
                </div>
              )}

              <p className="text-center text-[11px] text-muted-foreground pt-2 pb-1">
                Thank you for shopping with us 💜
              </p>
            </div>
          )}
        </div>

        {/* Sticky footer actions */}
        <div className="px-4 py-3 border-t border-border bg-card flex flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!order}
            className="rounded-full flex-1"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={!order}
            className="rounded-full flex-1"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface CollapsibleSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  accent?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection = ({
  open,
  onOpenChange,
  icon,
  title,
  badge,
  accent,
  children,
}: CollapsibleSectionProps) => (
  <Collapsible open={open} onOpenChange={onOpenChange}>
    <div
      className={cn(
        'rounded-xl border bg-card overflow-hidden transition-shadow',
        accent ? 'border-primary/30 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.3)]' : 'border-border',
      )}
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/40 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0',
              accent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
            )}
          >
            {icon}
          </div>
          <span className="font-bold text-sm truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {badge && (
            <span className="text-[11px] text-muted-foreground font-semibold truncate max-w-[140px]">
              {badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-4 pb-4 pt-1">{children}</div>
      </CollapsibleContent>
    </div>
  </Collapsible>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

export default InvoiceDialog;
