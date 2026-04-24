import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Send, Users, Eye, MousePointerClick, Megaphone } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  message: string;
  url: string | null;
  category: string;
  status: string;
  recipients_count: number | null;
  delivered_count: number;
  clicked_count: number;
  sent_at: string | null;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: 'announcements', label: 'Announcement' },
  { value: 'offers', label: 'Offer / Discount' },
  { value: 'flash_sales', label: 'Flash Sale' },
  { value: 'new_arrivals', label: 'New Arrivals' },
];

const AdminPushCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '', message: '', url: '', category: 'announcements',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        supabase.functions.invoke('admin-push-campaign', { body: { action: 'list' } }),
        supabase.functions.invoke('admin-push-campaign', { body: { action: 'stats' } }),
      ]);
      setCampaigns(list.data?.data || []);
      setSubscriberCount(stats.data?.subscriberCount || 0);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: 'Title and message required', variant: 'destructive' }); return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-push-campaign', {
        body: {
          action: 'send',
          title: form.title.trim(),
          message: form.message.trim(),
          url: form.url.trim() || null,
          category: form.category,
        },
      });
      if (error) throw error;
      toast({ title: 'Campaign sent', description: `Delivered to ${data?.sent || 0} device(s)` });
      setForm({ title: '', message: '', url: '', category: 'announcements' });
      load();
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  const rate = (num: number, denom: number) => denom > 0 ? `${Math.round((num / denom) * 100)}%` : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Push Campaigns</h2>
        <Badge variant="secondary" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {subscriberCount} subscribed device(s)
        </Badge>
      </div>

      {/* Composer */}
      <Card className="mb-6 border border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">New broadcast</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} maxLength={60}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Flash Sale is LIVE" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Message *</Label>
            <Textarea value={form.message} maxLength={150} rows={3}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="30% off everything for the next 2 hours" />
          </div>
          <div>
            <Label>Click URL (optional)</Label>
            <Input value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="/products" />
          </div>
          <Button onClick={handleSend} disabled={sending} className="gap-1.5">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to all subscribers
          </Button>
          <p className="text-xs text-muted-foreground">
            Respects each user's category preferences. Delivery & click stats appear below.
          </p>
        </CardContent>
      </Card>

      {/* History with analytics */}
      <h3 className="font-semibold mb-3">Past campaigns</h3>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : campaigns.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No campaigns sent yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map(c => (
            <Card key={c.id} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{c.title}</span>
                      <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                      <Badge variant={c.status === 'sent' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{c.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {c.sent_at ? new Date(c.sent_at).toLocaleString('en-IN') : new Date(c.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Send className="h-3 w-3" />Sent</div>
                    <div className="font-semibold">{c.recipients_count || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" />Seen on screen</div>
                    <div className="font-semibold">{c.delivered_count}<span className="text-xs text-muted-foreground ml-1">({rate(c.delivered_count, c.recipients_count || 0)})</span></div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><MousePointerClick className="h-3 w-3" />Tapped</div>
                    <div className="font-semibold">{c.clicked_count}<span className="text-xs text-muted-foreground ml-1">({rate(c.clicked_count, c.delivered_count)})</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPushCampaigns;
