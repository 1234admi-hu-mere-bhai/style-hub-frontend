import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Plus, Trash2, Edit2, Loader2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface FlashSale {
  id: string;
  title: string;
  description: string;
  discount_percentage: number;
  product_ids: string[];
  banner_color: string;
  is_active: boolean;
  start_time: string;
  end_time: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
}

const AdminFlashSales = () => {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPct, setDiscountPct] = useState(20);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-crud', {
      body: { table: 'flash_sales', action: 'list' },
    });
    if (!error && data?.data) setSales(data.data);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name, image, price');
    if (data) setProducts(data as Product[]);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDiscountPct(20);
    setSelectedProductIds([]);
    setStartTime('');
    setEndTime('');
    setIsActive(false);
    setEditingSale(null);
  };

  const openCreate = () => {
    resetForm();
    // Default start: now, end: 24h from now
    const now = new Date();
    const end = new Date(now.getTime() + 86400000);
    setStartTime(toLocalDatetime(now));
    setEndTime(toLocalDatetime(end));
    setDialogOpen(true);
  };

  const openEdit = (sale: FlashSale) => {
    setEditingSale(sale);
    setTitle(sale.title);
    setDescription(sale.description);
    setDiscountPct(sale.discount_percentage);
    setSelectedProductIds(sale.product_ids);
    setStartTime(toLocalDatetime(new Date(sale.start_time)));
    setEndTime(toLocalDatetime(new Date(sale.end_time)));
    setIsActive(sale.is_active);
    setDialogOpen(true);
  };

  const toLocalDatetime = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!endTime) { toast.error('End time is required'); return; }
    if (selectedProductIds.length === 0) { toast.error('Select at least one product'); return; }

    setSaving(true);
    const record: any = {
      title: title.trim(),
      description: description.trim(),
      discount_percentage: discountPct,
      product_ids: selectedProductIds,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      is_active: isActive,
    };

    if (editingSale) {
      record.id = editingSale.id;
      record.updated_at = new Date().toISOString();
    }

    const { error } = await supabase.functions.invoke('admin-crud', {
      body: {
        table: 'flash_sales',
        action: editingSale ? 'update' : 'create',
        record,
      },
    });

    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success(editingSale ? 'Flash sale updated' : 'Flash sale created');
    setDialogOpen(false);
    fetchSales();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.functions.invoke('admin-crud', {
      body: { table: 'flash_sales', action: 'delete', record: { id } },
    });
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Flash sale deleted');
    fetchSales();
  };

  const toggleActive = async (sale: FlashSale) => {
    await supabase.functions.invoke('admin-crud', {
      body: {
        table: 'flash_sales',
        action: 'update',
        record: { id: sale.id, is_active: !sale.is_active, updated_at: new Date().toISOString() },
      },
    });
    toast.success(sale.is_active ? 'Sale deactivated' : 'Sale activated');
    fetchSales();
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const isExpired = (sale: FlashSale) => new Date(sale.end_time) < new Date();
  const isLive = (sale: FlashSale) => sale.is_active && !isExpired(sale) && new Date(sale.start_time) <= new Date();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Flash Sales</h2>
          <p className="text-sm text-muted-foreground">Create time-limited deals with countdown timers</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Flash Sale
        </Button>
      </div>

      {/* Sales list */}
      {sales.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No flash sales yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <div key={sale.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{sale.title}</h3>
                  {isLive(sale) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> LIVE
                    </span>
                  )}
                  {isExpired(sale) && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      EXPIRED
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {sale.discount_percentage}% off · {sale.product_ids.length} products ·{' '}
                  {new Date(sale.start_time).toLocaleDateString()} - {new Date(sale.end_time).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleActive(sale)} title={sale.is_active ? 'Deactivate' : 'Activate'}>
                  <Power className={`w-4 h-4 ${sale.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(sale)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Flash Sale" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional subtitle" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Discount %</label>
                <Input type="number" min={1} max={90} value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5 flex items-end gap-3">
                <div>
                  <label className="text-sm font-medium">Active</label>
                  <div className="mt-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Start Time</label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">End Time *</label>
                <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            {/* Product selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Products * ({selectedProductIds.length} selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-border rounded-lg p-3">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                      selectedProductIds.includes(p.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <img src={p.image} alt={p.name} className="w-8 h-10 object-cover rounded flex-shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingSale ? 'Update' : 'Create'} Flash Sale
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFlashSales;
