import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, RefreshCw, ClipboardList, Eye } from 'lucide-react';

interface PendingChange {
  id: string;
  staff_user_id: string;
  staff_email: string;
  module: string;
  target_table: string;
  action: string;
  target_id: string | null;
  proposed_data: any;
  previous_data: any;
  summary: string;
  status: string;
  reviewer_email: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const AdminPendingApprovals = () => {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [items, setItems] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PendingChange | null>(null);
  const [reviewing, setReviewing] = useState<{ change: PendingChange; mode: 'approve' | 'reject' } | null>(null);
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);

  const load = async (status: typeof tab) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('staff-pending-changes', {
        body: { action: 'list', status },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setItems(data?.changes || []);
    } catch (e: any) {
      toast({ title: 'Failed to load', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab); }, [tab]);

  const handleReview = async () => {
    if (!reviewing) return;
    setWorking(true);
    try {
      const { data, error } = await supabase.functions.invoke('staff-pending-changes', {
        body: {
          action: reviewing.mode === 'approve' ? 'approve' : 'reject',
          id: reviewing.change.id,
          notes: notes.trim() || undefined,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({
        title: reviewing.mode === 'approve' ? 'Change approved & applied' : 'Change rejected',
      });
      setReviewing(null);
      setNotes('');
      load(tab);
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setWorking(false);
    }
  };

  const renderJson = (obj: any) => {
    if (!obj) return <p className="text-xs text-muted-foreground italic">None</p>;
    return (
      <pre className="text-[11px] bg-muted/50 p-3 rounded-md overflow-x-auto max-h-60 leading-relaxed">
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5" /> Pending Approvals
        </h2>
        <p className="text-sm text-muted-foreground">
          Staff edits stay in this queue until you approve or reject them. Approved changes are applied immediately.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({tab === 'pending' ? items.length : '…'})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <Button variant="ghost" size="sm" onClick={() => load(tab)} className="ml-auto float-right -mt-9">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>

        <TabsContent value={tab} className="space-y-2 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No {tab} changes.</p>
              </CardContent>
            </Card>
          ) : (
            items.map((c) => (
              <Card key={c.id} className="border border-border/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{c.module}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{c.action}</Badge>
                        <Badge variant="outline" className="text-[10px]">{c.target_table}</Badge>
                      </div>
                      <p className="text-sm font-medium mt-1.5">{c.summary}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        By <span className="font-medium">{c.staff_email}</span> ·{' '}
                        {new Date(c.created_at).toLocaleString('en-IN')}
                      </p>
                      {c.reviewer_email && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {c.status === 'approved' ? '✓ Approved' : '✗ Rejected'} by {c.reviewer_email}
                          {c.reviewed_at && ` · ${new Date(c.reviewed_at).toLocaleString('en-IN')}`}
                          {c.reviewer_notes && (
                            <span className="block italic">"{c.reviewer_notes}"</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setView(c)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      {c.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => { setReviewing({ change: c, mode: 'approve' }); setNotes(''); }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { setReviewing({ change: c, mode: 'reject' }); setNotes(''); }}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* DIFF VIEW DIALOG */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change details</DialogTitle>
            <DialogDescription>{view?.summary}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Proposed {view.action === 'delete' ? '(will be deleted)' : 'changes'}
                </p>
                {view.action === 'delete'
                  ? <p className="text-sm text-destructive">Row will be permanently removed.</p>
                  : renderJson(view.proposed_data)}
              </div>
              {view.action !== 'create' && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                    Current (before change)
                  </p>
                  {renderJson(view.previous_data)}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setView(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* APPROVE / REJECT DIALOG */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewing?.mode === 'approve' ? 'Approve this change?' : 'Reject this change?'}
            </DialogTitle>
            <DialogDescription>
              {reviewing?.mode === 'approve'
                ? 'This will apply the change immediately to the live store.'
                : 'The staff member will be notified in the activity log.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">{reviewing?.change.summary}</p>
            <Textarea
              placeholder="Optional note for the staff member…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button
              variant={reviewing?.mode === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={working}
            >
              {working && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              {reviewing?.mode === 'approve' ? 'Approve & apply' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPendingApprovals;
