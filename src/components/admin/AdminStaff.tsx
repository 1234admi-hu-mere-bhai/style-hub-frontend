import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Loader2, Plus, Trash2, RefreshCw, Activity, ShieldCheck, UserCog, X, Users as UsersIcon, MailCheck,
} from 'lucide-react';
import { STAFF_MODULES, DEFAULT_NEW_STAFF_PERMS } from '@/lib/staffModules';

interface StaffRow {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  status: string;
  permissions: Record<string, boolean>;
  joined_at: string;
}
interface InviteRow {
  id: string;
  email: string;
  token: string;
  display_name: string;
  permissions: Record<string, boolean>;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}
interface ActivityRow {
  id: string;
  actor_user_id: string | null;
  actor_email: string;
  actor_role: string;
  module: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  summary: string;
  created_at: string;
}

const inviteUrl = (token: string) =>
  `${window.location.origin}/staff-invite/${token}`;

const AdminStaff = () => {
  const [tab, setTab] = useState<'team' | 'invites' | 'activity'>('team');
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '', display_name: '',
    permissions: { ...DEFAULT_NEW_STAFF_PERMS, dashboard: true },
  });
  const [creating, setCreating] = useState(false);
  const [generated, setGenerated] = useState<{ url: string; email: string } | null>(null);

  const [editStaff, setEditStaff] = useState<StaffRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<StaffRow | null>(null);

  const [activityFilter, setActivityFilter] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, i, a] = await Promise.all([
        supabase.functions.invoke('staff-management', { body: { action: 'list-staff' } }),
        supabase.functions.invoke('staff-management', { body: { action: 'list-invites' } }),
        supabase.functions.invoke('staff-management', {
          body: { action: 'list-activity', limit: 200 },
        }),
      ]);
      if (s.data?.staff) setStaff(s.data.staff);
      if (i.data?.invites) setInvites(i.data.invites);
      if (a.data?.activity) setActivity(a.data.activity);
    } catch (e: any) {
      toast({ title: 'Failed to load', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreateInvite = async () => {
    if (!inviteForm.email.trim()) {
      toast({ title: 'Email required', variant: 'destructive' }); return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('staff-management', {
        body: { action: 'create-invite', ...inviteForm },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setGenerated({ url: inviteUrl(data.invite.token), email: data.invite.email });
      setShowInvite(false);
      setInviteForm({ email: '', display_name: '', permissions: { ...DEFAULT_NEW_STAFF_PERMS, dashboard: true } });
      load();
    } catch (e: any) {
      toast({ title: 'Could not create invite', description: e.message, variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const handleSaveStaff = async () => {
    if (!editStaff) return;
    setSavingEdit(true);
    try {
      const { error, data } = await supabase.functions.invoke('staff-management', {
        body: {
          action: 'update-staff',
          id: editStaff.id,
          display_name: editStaff.display_name,
          status: editStaff.status,
          permissions: editStaff.permissions,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: 'Staff updated' });
      setEditStaff(null);
      load();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally { setSavingEdit(false); }
  };

  const handleRemoveStaff = async () => {
    if (!removeConfirm) return;
    try {
      const { error, data } = await supabase.functions.invoke('staff-management', {
        body: { action: 'remove-staff', id: removeConfirm.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: 'Staff removed' });
      setRemoveConfirm(null);
      load();
    } catch (e: any) {
      toast({ title: 'Remove failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      await supabase.functions.invoke('staff-management', {
        body: { action: 'revoke-invite', id },
      });
      load();
    } catch (e: any) {
      toast({ title: 'Revoke failed', description: e.message, variant: 'destructive' });
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Invite link copied' });
  };

  const filteredActivity = activityFilter
    ? activity.filter((a) => a.actor_email === activityFilter)
    : activity;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <UsersIcon className="h-5 w-5" /> Staff & Permissions
          </h2>
          <p className="text-sm text-muted-foreground">
            Invite teammates and control exactly what they can manage.
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Invite staff
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="team">Team ({staff.length})</TabsTrigger>
          <TabsTrigger value="invites">Invites ({invites.filter((i) => !i.accepted_at).length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* TEAM */}
        <TabsContent value="team" className="space-y-2 mt-4">
          {staff.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <UserCog className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No staff yet. Invite someone to get started.</p>
            </CardContent></Card>
          ) : staff.map((s) => {
            const granted = Object.entries(s.permissions).filter(([, v]) => v).length;
            return (
              <Card key={s.id} className="border border-border/50">
                <CardContent className="p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{s.display_name || s.email}</span>
                      <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {s.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {granted} module{granted === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.email}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Joined {new Date(s.joined_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setEditStaff({ ...s })}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => setRemoveConfirm(s)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* INVITES */}
        <TabsContent value="invites" className="space-y-2 mt-4">
          {invites.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <p>No invites created yet.</p>
            </CardContent></Card>
          ) : invites.map((inv) => {
            const expired = new Date(inv.expires_at).getTime() < Date.now();
            const used = !!inv.accepted_at;
            return (
              <Card key={inv.id} className="border border-border/50">
                <CardContent className="p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{inv.email}</span>
                      <Badge
                        variant={used ? 'secondary' : expired ? 'destructive' : 'default'}
                        className="text-[10px]"
                      >
                        {used ? 'accepted' : expired ? 'expired' : 'pending'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 break-all">
                      {inviteUrl(inv.token)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Expires {new Date(inv.expires_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {!used && !expired && (
                      <Button variant="outline" size="sm" onClick={() => copyLink(inviteUrl(inv.token))}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => handleRevokeInvite(inv.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="space-y-2 mt-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Button
              variant={activityFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivityFilter('')}
            >
              All
            </Button>
            {Array.from(new Set(activity.map((a) => a.actor_email))).filter(Boolean).map((email) => (
              <Button
                key={email}
                variant={activityFilter === email ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivityFilter(email)}
              >
                {email}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={load} className="ml-auto">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
          {filteredActivity.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <p>No activity recorded yet.</p>
            </CardContent></Card>
          ) : filteredActivity.map((a) => (
            <Card key={a.id} className="border border-border/50">
              <CardContent className="p-3.5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={a.actor_role === 'owner' ? 'default' : 'secondary'} className="text-[10px]">
                        {a.actor_role}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{a.module}</Badge>
                      <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
                      <span className="text-xs font-medium">{a.actor_email}</span>
                    </div>
                    <p className="text-sm mt-1">{a.summary}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* INVITE DIALOG */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite staff member</DialogTitle>
            <DialogDescription>Generate an invite link to share via email/WhatsApp.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Display name (optional)</Label>
              <Input value={inviteForm.display_name}
                onChange={(e) => setInviteForm({ ...inviteForm, display_name: e.target.value })} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />Permissions</Label>
              <div className="space-y-2 mt-2 max-h-72 overflow-y-auto pr-1">
                {STAFF_MODULES.map((m) => (
                  <div key={m.key} className="flex items-start gap-3 py-1.5 border-b border-border/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-[11px] text-muted-foreground">{m.description}</p>
                    </div>
                    <Switch
                      checked={!!inviteForm.permissions[m.key]}
                      onCheckedChange={(v) => setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, [m.key]: v },
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleCreateInvite} disabled={creating}>
              {creating && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Create invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GENERATED LINK DIALOG */}
      <Dialog open={!!generated} onOpenChange={(o) => !o && setGenerated(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite sent ✉️</DialogTitle>
            <DialogDescription>
              An invite email has been sent to{' '}
              <span className="font-medium text-foreground">{generated?.email}</span>.
              Ask them to check their inbox (and Spam/Promotions folder). They must sign
              in with this email to accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Backup link (in case email doesn't arrive):</p>
            <div className="bg-muted p-3 rounded-md text-xs break-all font-mono">{generated?.url}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerated(null)}>Done</Button>
            <Button onClick={() => copyLink(generated!.url)}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT STAFF DIALOG */}
      <Dialog open={!!editStaff} onOpenChange={(o) => !o && setEditStaff(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit staff</DialogTitle>
            <DialogDescription>{editStaff?.email}</DialogDescription>
          </DialogHeader>
          {editStaff && (
            <div className="space-y-3">
              <div>
                <Label>Display name</Label>
                <Input value={editStaff.display_name}
                  onChange={(e) => setEditStaff({ ...editStaff, display_name: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editStaff.status === 'active'}
                  onCheckedChange={(v) =>
                    setEditStaff({ ...editStaff, status: v ? 'active' : 'disabled' })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />Permissions</Label>
                <div className="space-y-2 mt-2 max-h-64 overflow-y-auto pr-1">
                  {STAFF_MODULES.map((m) => (
                    <div key={m.key} className="flex items-start gap-3 py-1.5 border-b border-border/30">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.label}</p>
                        <p className="text-[11px] text-muted-foreground">{m.description}</p>
                      </div>
                      <Switch
                        checked={!!editStaff.permissions[m.key]}
                        onCheckedChange={(v) => setEditStaff({
                          ...editStaff,
                          permissions: { ...editStaff.permissions, [m.key]: v },
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditStaff(null)}>Cancel</Button>
            <Button onClick={handleSaveStaff} disabled={savingEdit}>
              {savingEdit && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REMOVE CONFIRM */}
      <Dialog open={!!removeConfirm} onOpenChange={(o) => !o && setRemoveConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {removeConfirm?.email}?</DialogTitle>
            <DialogDescription>
              They will immediately lose access to the admin panel. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleRemoveStaff}>Remove</Button>
            <Button variant="outline" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaff;
