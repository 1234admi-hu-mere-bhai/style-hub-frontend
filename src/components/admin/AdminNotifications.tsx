import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Bell, Loader2, X, Send } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });
  const [sendingPush, setSendingPush] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'notifications', action: 'list' },
      });
      if (error) throw error;
      setNotifications(data.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleSave = async (alsoSendPush = false) => {
    if (!form.title) { toast({ title: 'Error', description: 'Title is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'notifications', action: 'create', record: form },
      });
      if (error) throw error;
      toast({ title: 'Notification created' });

      if (alsoSendPush) {
        await handleSendPush(form.title, form.message);
      }

      setShowForm(false);
      setForm({ title: '', message: '', type: 'info' });
      fetchNotifications();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleSendPush = async (title: string, message: string) => {
    setSendingPush(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { title, message },
      });
      if (error) throw error;
      toast({ title: 'Push sent', description: `Delivered to ${data?.sent || 0} subscriber(s)` });
    } catch (err: any) {
      toast({ title: 'Push failed', description: err.message, variant: 'destructive' });
    } finally { setSendingPush(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'notifications', action: 'delete', record: { id } },
      });
      if (error) throw error;
      toast({ title: 'Notification deleted' });
      setDeleteConfirm(null);
      fetchNotifications();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Notifications ({notifications.length})</h2>
        <Button onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-4 w-4" />Create</Button>
      </div>

      {showForm && (
        <Card className="mb-6 border border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">New Notification</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={val => setForm({ ...form, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}Create</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {notifications.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No notifications yet</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      <Badge variant="secondary" className={`text-[10px] ${typeColors[n.type] || ''}`}>{n.type}</Badge>
                    </div>
                    {n.message && <p className="text-xs text-muted-foreground mt-1">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs"><DialogHeader><DialogTitle>Delete Notification?</DialogTitle></DialogHeader>
          <div className="flex gap-3 mt-2"><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
