import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Tag, Loader2, X } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const EMPTY_COUPON = {
  code: '',
  discount_type: 'percentage',
  discount_value: 0,
  min_order_value: 0,
  max_uses: 0,
  is_active: true,
  expires_at: '',
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_COUPON);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'coupons', action: 'list' },
      });
      if (error) throw error;
      setCoupons(data.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EMPTY_COUPON); setEditingId(null); setShowForm(true); };

  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_value: c.min_order_value,
      max_uses: c.max_uses,
      is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast({ title: 'Error', description: 'Code and discount value required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const record: any = {
        ...form,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        ...(editingId ? { id: editingId } : {}),
      };
      const { error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'coupons', action: editingId ? 'update' : 'create', record },
      });
      if (error) throw error;
      toast({ title: editingId ? 'Coupon updated' : 'Coupon created' });
      setShowForm(false);
      fetchCoupons();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'coupons', action: 'delete', record: { id } },
      });
      if (error) throw error;
      toast({ title: 'Coupon deleted' });
      setDeleteConfirm(null);
      fetchCoupons();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Coupons ({coupons.length})</h2>
        <Button onClick={openAdd} className="gap-1.5"><Plus className="h-4 w-4" />Add Coupon</Button>
      </div>

      {showForm && (
        <Card className="mb-6 border border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editingId ? 'Edit Coupon' : 'Add Coupon'}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div><Label>Coupon Code *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" /></div>
              <div>
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={val => setForm({ ...form, discount_type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Discount Value *</Label><Input type="number" value={form.discount_value || ''} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} /></div>
              <div><Label>Min Order Value (₹)</Label><Input type="number" value={form.min_order_value || ''} onChange={e => setForm({ ...form, min_order_value: Number(e.target.value) })} /></div>
              <div><Label>Max Uses (0 = unlimited)</Label><Input type="number" value={form.max_uses || ''} onChange={e => setForm({ ...form, max_uses: Number(e.target.value) })} /></div>
              <div><Label>Expires At</Label><Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <Checkbox id="coupon-active" checked={form.is_active} onCheckedChange={checked => setForm({ ...form, is_active: !!checked })} />
                <Label htmlFor="coupon-active">Active</Label>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}{editingId ? 'Update' : 'Create'}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {coupons.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><Tag className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No coupons yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <Card key={c.id} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm">{c.code}</span>
                    <Badge variant={c.is_active ? 'default' : 'secondary'} className="ml-2 text-[10px]">{c.is_active ? 'Active' : 'Inactive'}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                      {c.min_order_value > 0 && ` · Min ₹${c.min_order_value}`}
                      {c.max_uses > 0 && ` · ${c.used_count}/${c.max_uses} used`}
                    </p>
                    {c.expires_at && <p className="text-[10px] text-muted-foreground">Expires: {new Date(c.expires_at).toLocaleDateString('en-IN')}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs"><DialogHeader><DialogTitle>Delete Coupon?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-3 mt-2"><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
