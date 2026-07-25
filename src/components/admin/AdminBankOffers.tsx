import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import BankOffersCard from '@/components/BankOffersCard';
import type { BankOffer } from '@/hooks/useBankOffers';

interface BankOfferRow {
  id: string;
  title: string;
  description: string | null;
  banks: string[];
  discount_type: 'percent' | 'flat';
  discount_value: number;
  max_discount: number | null;
  min_order: number;
  applies_to: 'all' | 'prepaid' | 'cod';
  priority: number;
  is_active: boolean;
  badge_text: string | null;
  footer_text: string | null;
  start_time: string | null;
  end_time: string | null;
}

type FormState = Omit<BankOfferRow, 'id'>;

const empty: FormState = {
  title: 'Mega Deal',
  description: '',
  banks: [],
  discount_type: 'percent',
  discount_value: 10,
  max_discount: 100,
  min_order: 499,
  applies_to: 'prepaid',
  priority: 0,
  is_active: true,
  badge_text: 'MEGA DEAL',
  footer_text: 'With Bank Offer',
  start_time: null,
  end_time: null,
};

const toLocalDatetime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const AdminBankOffers = () => {
  const [rows, setRows] = useState<BankOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [banksInput, setBanksInput] = useState('');
  const [previewPrice, setPreviewPrice] = useState(1499);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bank_offers' as any)
      .select('*')
      .order('priority', { ascending: false });
    setRows((data as unknown as BankOfferRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setBanksInput('');
    setShowForm(true);
  };

  const openEdit = (row: BankOfferRow) => {
    setEditingId(row.id);
    const { id, ...rest } = row;
    setForm({ ...empty, ...rest });
    setBanksInput((row.banks || []).join(', '));
    setShowForm(true);
  };

  const save = async () => {
    const payload = {
      ...form,
      banks: banksInput.split(',').map((s) => s.trim()).filter(Boolean),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      badge_text: form.badge_text?.trim() || null,
      footer_text: form.footer_text?.trim() || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
    };
    const q = editingId
      ? supabase.from('bank_offers' as any).update(payload as any).eq('id', editingId)
      : supabase.from('bank_offers' as any).insert(payload as any);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? 'Bank offer updated' : 'Bank offer created');
    setShowForm(false); setEditingId(null); setForm(empty); setBanksInput('');
    load();
  };

  const toggleActive = async (row: BankOfferRow) => {
    const { error } = await supabase
      .from('bank_offers' as any)
      .update({ is_active: !row.is_active } as any)
      .eq('id', row.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    const { error } = await supabase.from('bank_offers' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const previewOffer: BankOffer = {
    id: 'preview',
    title: form.title,
    description: form.description,
    banks: banksInput.split(',').map((s) => s.trim()).filter(Boolean),
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value) || 0,
    max_discount: form.max_discount != null ? Number(form.max_discount) : null,
    min_order: Number(form.min_order) || 0,
    applies_to: form.applies_to,
    priority: form.priority,
    badge_text: form.badge_text,
    footer_text: form.footer_text,
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Bank Offers</h2>
          <p className="text-sm text-muted-foreground">Mega Deal cards shown on product pages.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1" />New offer</Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Badge text</Label><Input value={form.badge_text ?? ''} placeholder="MEGA DEAL" onChange={(e) => setForm({ ...form, badge_text: e.target.value })} /></div>
            <div><Label>Footer text</Label><Input value={form.footer_text ?? ''} placeholder="With Bank Offer" onChange={(e) => setForm({ ...form, footer_text: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Banks (comma separated)</Label><Input value={banksInput} onChange={(e) => setBanksInput(e.target.value)} placeholder="HDFC, ICICI, SBI, UPI" /></div>
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <Label>Type</Label>
              <select className="w-full h-10 border border-border rounded-md px-2 bg-background" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}>
                <option value="percent">Percent</option>
                <option value="flat">Flat ₹</option>
              </select>
            </div>
            <div><Label>Value</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></div>
            <div><Label>Max ₹ cap</Label><Input type="number" value={form.max_discount ?? ''} onChange={(e) => setForm({ ...form, max_discount: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><Label>Min order</Label><Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Applies to</Label>
              <select className="w-full h-10 border border-border rounded-md px-2 bg-background" value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value as any })}>
                <option value="all">All payments</option>
                <option value="prepaid">Prepaid only</option>
                <option value="cod">COD only</option>
              </select>
            </div>
            <div>
              <Label>Starts (optional)</Label>
              <Input type="datetime-local" value={toLocalDatetime(form.start_time)} onChange={(e) => setForm({ ...form, start_time: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div>
              <Label>Ends (optional)</Label>
              <Input type="datetime-local" value={toLocalDatetime(form.end_time)} onChange={(e) => setForm({ ...form, end_time: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Live preview</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sample price ₹</span>
                <Input className="h-8 w-24" type="number" value={previewPrice} onChange={(e) => setPreviewPrice(Number(e.target.value))} />
              </div>
            </div>
            <BankOffersCard basePrice={previewPrice} previewOffer={previewOffer} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={save}>{editingId ? 'Update offer' : 'Save offer'}</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No bank offers yet.</p>}
        {rows.map((r) => (
          <Card key={r.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{r.title}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {r.discount_type === 'percent' ? `${r.discount_value}% off` : `Flat ₹${r.discount_value}`}
                  {r.max_discount ? ` up to ₹${r.max_discount}` : ''}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.applies_to}</span>
              </div>
              {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">
                Banks: {r.banks.join(', ') || '—'} · Min order ₹{r.min_order} · Priority {r.priority}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Badge: {r.badge_text || 'MEGA DEAL'} · Footer: {r.footer_text || 'With Bank Offer'}
                {r.end_time ? ` · Ends ${new Date(r.end_time).toLocaleString()}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
              <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil size={16} /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 size={16} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminBankOffers;
