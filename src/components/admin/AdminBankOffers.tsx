import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
}

const empty: Omit<BankOfferRow, 'id'> = {
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
};

const AdminBankOffers = () => {
  const [rows, setRows] = useState<BankOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [banksInput, setBanksInput] = useState('');

  const load = async () => {
    setLoading(true);
    // Admin needs to see inactive too — use service via direct query (owner RLS allows).
    const { data } = await supabase
      .from('bank_offers' as any)
      .select('*')
      .order('priority', { ascending: false });
    setRows((data as unknown as BankOfferRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      ...form,
      banks: banksInput.split(',').map((s) => s.trim()).filter(Boolean),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
    };
    const { error } = await supabase.from('bank_offers' as any).insert(payload as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Bank offer created');
    setCreating(false); setForm(empty); setBanksInput('');
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold">Bank Offers</h2>
          <p className="text-sm text-muted-foreground">Myntra-style extra-discount cards shown on product pages.</p>
        </div>
        <Button onClick={() => setCreating(v => !v)}><Plus size={16} className="mr-1" />New offer</Button>
      </div>

      {creating && (
        <Card className="p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div>
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
          <div>
            <Label>Applies to</Label>
            <select className="w-full h-10 border border-border rounded-md px-2 bg-background" value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value as any })}>
              <option value="all">All payments</option>
              <option value="prepaid">Prepaid only</option>
              <option value="cod">COD only</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={save}>Save offer</Button>
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
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 size={16} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminBankOffers;
