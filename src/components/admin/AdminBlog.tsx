import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, FileText, Loader2, X } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  is_published: boolean;
  author: string;
  tags: string[];
  created_at: string;
}

const EMPTY_POST = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  image: '',
  is_published: false,
  author: 'Admin',
  tags: [] as string[],
};

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_POST);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'blog_posts', action: 'list' },
      });
      if (error) throw error;
      setPosts(data.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EMPTY_POST); setTagsInput(''); setEditingId(null); setShowForm(true); };

  const openEdit = (p: BlogPost) => {
    setForm({
      title: p.title, slug: p.slug, content: p.content, excerpt: p.excerpt,
      image: p.image, is_published: p.is_published, author: p.author, tags: p.tags || [],
    });
    setTagsInput((p.tags || []).join(', '));
    setEditingId(p.id);
    setShowForm(true);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSave = async () => {
    if (!form.title) { toast({ title: 'Error', description: 'Title is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const slug = form.slug || generateSlug(form.title);
      const record: any = { ...form, tags, slug, ...(editingId ? { id: editingId } : {}) };
      const { error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'blog_posts', action: editingId ? 'update' : 'create', record },
      });
      if (error) throw error;
      toast({ title: editingId ? 'Post updated' : 'Post created' });
      setShowForm(false);
      fetchPosts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-crud', {
        body: { table: 'blog_posts', action: 'delete', record: { id } },
      });
      if (error) throw error;
      toast({ title: 'Post deleted' });
      setDeleteConfirm(null);
      fetchPosts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Blog ({posts.length})</h2>
        <Button onClick={openAdd} className="gap-1.5"><Plus className="h-4 w-4" />New Post</Button>
      </div>

      {showForm && (
        <Card className="mb-6 border border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editingId ? 'Edit Post' : 'New Post'}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => { setForm({ ...form, title: e.target.value }); if (!editingId) setForm(f => ({ ...f, slug: generateSlug(e.target.value) })); }} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Excerpt</Label><Input value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} /></div>
              <div><Label>Image URL</Label><Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
              <div><Label>Author</Label><Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /></div>
              <div><Label>Tags (comma-separated)</Label><Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} /></div>
              <div><Label>Content *</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8} /></div>
              <div className="flex items-center gap-2">
                <Checkbox id="published" checked={form.is_published} onCheckedChange={checked => setForm({ ...form, is_published: !!checked })} />
                <Label htmlFor="published">Published</Label>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}{editingId ? 'Update' : 'Create'}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No blog posts yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <Card key={p.id} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium">{p.title}</span>
                    <Badge variant={p.is_published ? 'default' : 'secondary'} className="ml-2 text-[10px]">{p.is_published ? 'Published' : 'Draft'}</Badge>
                    {p.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {p.author} · {new Date(p.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs"><DialogHeader><DialogTitle>Delete Post?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-3 mt-2"><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
