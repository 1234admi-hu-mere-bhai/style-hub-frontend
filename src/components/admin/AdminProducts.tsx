import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Package, Loader2, X, Sparkles, RotateCw, User, Upload } from 'lucide-react';
import ColorVariantsEditor, { type ColorVariant } from './ColorVariantsEditor';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  discount: number;
  category: string;
  subcategory: string;
  image: string;
  additional_images: string[];
  stock_quantity: number;
  low_stock_threshold: number;
  sizes: string[];
  colors: any[];
  tags: string[];
  in_stock: boolean;
  description: string;
  created_at: string;
  mannequin_image?: string | null;
  human_model_image?: string | null;
  rotation_frames?: string[] | null;
}

const EMPTY_PRODUCT = {
  name: '',
  brand: '',
  price: 0,
  original_price: null as number | null,
  discount: 0,
  category: 'men',
  subcategory: '',
  image: '',
  additional_images: [] as string[],
  stock_quantity: 0,
  low_stock_threshold: 10,
  sizes: [] as string[],
  colors: [] as any[],
  tags: [] as string[],
  in_stock: true,
  description: '',
  mannequin_image: '' as string,
  human_model_image: '' as string,
  rotation_frames: [] as string[],
};

const DRAFT_KEY = 'admin-products-draft-v1';

interface Draft {
  showForm: boolean;
  editingId: string | null;
  form: typeof EMPTY_PRODUCT;
  sizesInput: string;
  tagsInput: string;
  additionalImagesInput: string;
}

const loadDraft = (): Draft | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const draft = loadDraft();
  const [showForm, setShowForm] = useState(draft?.showForm ?? false);
  const [editingId, setEditingId] = useState<string | null>(draft?.editingId ?? null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state — restored from sessionStorage so switching tabs doesn't wipe in-progress edits
  const [form, setForm] = useState(draft?.form ?? EMPTY_PRODUCT);
  const [sizesInput, setSizesInput] = useState(draft?.sizesInput ?? '');
  const [colorsInput, setColorsInput] = useState('');
  const [tagsInput, setTagsInput] = useState(draft?.tagsInput ?? '');
  const [additionalImagesInput, setAdditionalImagesInput] = useState(draft?.additionalImagesInput ?? '');

  // Persist draft on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        showForm, editingId, form, sizesInput, tagsInput, additionalImagesInput,
      }));
    } catch {}
  }, [showForm, editingId, form, sizesInput, tagsInput, additionalImagesInput]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-products', {
        body: { action: 'list' },
      });
      if (error) throw error;
      setProducts(data.products || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setForm(EMPTY_PRODUCT);
    setSizesInput('');
    setColorsInput('');
    setTagsInput('');
    setAdditionalImagesInput('');
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setForm({
      name: product.name,
      brand: product.brand,
      price: product.price,
      original_price: product.original_price,
      discount: product.discount,
      category: product.category,
      subcategory: product.subcategory,
      image: product.image,
      additional_images: product.additional_images || [],
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      sizes: product.sizes || [],
      colors: product.colors || [],
      tags: product.tags || [],
      in_stock: product.in_stock,
      description: product.description,
      mannequin_image: product.mannequin_image || '',
      human_model_image: product.human_model_image || '',
      rotation_frames: product.rotation_frames || [],
    });
    setSizesInput((product.sizes || []).join(', '));
    setColorsInput('');
    setTagsInput((product.tags || []).join(', '));
    setAdditionalImagesInput((product.additional_images || []).join(', '));
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: 'Error', description: 'Name and price are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const sizes = sizesInput.split(',').map(s => s.trim()).filter(Boolean);
      // Colors managed by ColorVariantsEditor; keep only filled slots
      const colors = (form.colors as ColorVariant[]).filter(c => c && (c.image || c.name));
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const additional_images = additionalImagesInput.split(',').map(i => i.trim()).filter(Boolean);

      const productData = {
        ...form,
        sizes,
        colors,
        tags,
        additional_images,
        ...(editingId ? { id: editingId } : {}),
      };

      const { error } = await supabase.functions.invoke('admin-products', {
        body: { action: editingId ? 'update' : 'create', product: productData },
      });
      if (error) throw error;

      toast({ title: editingId ? 'Product updated' : 'Product added' });
      setShowForm(false);
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-products', {
        body: { action: 'delete', product: { id } },
      });
      if (error) throw error;
      toast({ title: 'Product deleted' });
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const [generatingMannequin, setGeneratingMannequin] = useState(false);
  const [generatingHuman, setGeneratingHuman] = useState(false);
  const [generating360, setGenerating360] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [rotationBase, setRotationBase] = useState<'mannequin' | 'human' | 'product'>('mannequin');

  // Upload a file from gallery to product-images bucket, returns public URL
  const uploadToStorage = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `uploads/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const generateModelImage = async (action: 'mannequin' | 'human', productImage: string) => {
    const { data, error } = await supabase.functions.invoke('generate-product-mannequin', {
      body: { action, productImage, subcategory: form.subcategory, productId: editingId || undefined },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No image returned');
    return data as { url: string; region: string };
  };

  const saveProductPatch = async (updates: Partial<typeof EMPTY_PRODUCT>) => {
    if (!editingId) return;
    const { error } = await supabase.functions.invoke('admin-products', {
      body: { action: 'update', product: { id: editingId, ...updates } },
    });
    if (error) throw error;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'mannequin_image' | 'human_model_image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const uploadedUrl = await uploadToStorage(file, field);

      if (field === 'mannequin_image' || field === 'human_model_image') {
        const action = field === 'human_model_image' ? 'human' : 'mannequin';
        toast({ title: `${action === 'human' ? 'Human model' : 'Mannequin'} generation started` });
        const generated = await generateModelImage(action, uploadedUrl);
        setForm(f => ({ ...f, [field]: generated.url }));
        await saveProductPatch({ [field]: generated.url } as Partial<typeof EMPTY_PRODUCT>);
        toast({
          title: `${action === 'human' ? 'Human model' : 'Mannequin'} generated${editingId ? ' and saved' : ''}`,
          description: editingId ? `Region: ${generated.region}. Public page updated.` : `Region: ${generated.region}. Save product to publish.`,
        });
        return;
      }

      setForm(f => ({ ...f, [field]: uploadedUrl }));
      toast({ title: 'Image uploaded', description: 'Use AI Generate to create mannequin or human model views.' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const runGenerate = async (action: 'mannequin' | 'human') => {
    if (!form.image) {
      toast({ title: 'Add a product image first', variant: 'destructive' });
      return;
    }
    const setter = action === 'human' ? setGeneratingHuman : setGeneratingMannequin;
    setter(true);
    try {
      const field = action === 'human' ? 'human_model_image' : 'mannequin_image';
      const data = await generateModelImage(action, form.image);
      setForm(f => ({ ...f, [field]: data.url }));
      await saveProductPatch({ [field]: data.url } as Partial<typeof EMPTY_PRODUCT>);
      toast({
        title: `${action === 'human' ? 'Human model' : 'Mannequin'} generated${editingId ? ' and saved' : ''}`,
        description: editingId ? `Region: ${data.region}. Public page updated.` : `Region: ${data.region}. Save product to publish.`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setter(false);
    }
  };

  const handleGenerate360 = async () => {
    const base = rotationBase === 'human' ? form.human_model_image
      : rotationBase === 'mannequin' ? form.mannequin_image
      : form.image;
    if (!base) {
      toast({ title: `No ${rotationBase} image available`, description: 'Generate or upload it first.', variant: 'destructive' });
      return;
    }
    setGenerating360(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-mannequin', {
        body: { action: 'rotation', baseImage: base, subject: rotationBase === 'human' ? 'human' : 'mannequin', subcategory: form.subcategory, productId: editingId || undefined, frameCount: 12 },
      });
      if (error) throw error;
      if (!data?.frames?.length) throw new Error('No frames returned');
      setForm(f => ({ ...f, rotation_frames: data.frames }));
      toast({ title: '360° frames generated', description: `${data.frames.length} frames ready. Remember to Save.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating360(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Products ({products.length})</h2>
        <Button onClick={openAddForm} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-6 border border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editingId ? 'Edit Product' : 'Add Product'}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <span className="h-5 w-1 rounded-full bg-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">1. Basic Info</h4>
              </div>
              <div>
                <Label>Product Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Brand *</Label>
                <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price (Rs.) *</Label>
                  <Input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Original Price (Rs.)</Label>
                  <Input type="number" value={form.original_price || ''} onChange={e => setForm({ ...form, original_price: Number(e.target.value) || null })} />
                </div>
              </div>
              <div>
                <Label>Discount %</Label>
                <Input type="number" value={form.discount || ''} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={val => setForm({ ...form, category: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory *</Label>
                <Input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} placeholder="Subcategory" />
              </div>
              <div className="flex items-center gap-2 pt-3 pb-1 border-b border-border/60">
                <span className="h-5 w-1 rounded-full bg-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">2. Main Image & Stock</h4>
              </div>
              <div>
                <Label>Product Image *</Label>
                <div className="flex gap-2">
                  <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Paste URL or upload below" className="flex-1" />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingField === 'image'} asChild>
                    <label className="cursor-pointer">
                      {uploadingField === 'image' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      <span className="ml-1.5">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                    </label>
                  </Button>
                </div>
                {form.image && <img src={form.image} alt="Product preview" className="mt-2 w-24 h-32 object-cover rounded-md bg-muted" />}
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input type="number" value={form.stock_quantity || ''} onChange={e => setForm({ ...form, stock_quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input type="number" value={form.low_stock_threshold || ''} onChange={e => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Additional Images (comma-separated URLs)</Label>
                <Input value={additionalImagesInput} onChange={e => setAdditionalImagesInput(e.target.value)} placeholder="Additional Image URLs" />
              </div>

              {/* AI Mannequin section */}
              <div className="rounded-lg border border-border/50 p-3 space-y-2 bg-secondary/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Label className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Mannequin Image</Label>
                    <p className="text-xs text-muted-foreground">AI dresses garment on a faceless mannequin. Body region auto-detected from subcategory.</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" variant="outline" disabled={uploadingField === 'mannequin_image'} asChild>
                      <label className="cursor-pointer">
                        {uploadingField === 'mannequin_image' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        <span className="ml-1.5">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'mannequin_image')} />
                      </label>
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => runGenerate('mannequin')} disabled={generatingMannequin || !form.image}>
                      {generatingMannequin ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span className="ml-1.5">{form.mannequin_image ? 'Regenerate' : 'AI Generate'}</span>
                    </Button>
                  </div>
                </div>
                {form.mannequin_image && (
                  <div className="flex items-start gap-3">
                    <img src={form.mannequin_image} alt="Mannequin preview" className="w-24 h-32 object-cover rounded-md bg-muted" />
                    <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => setForm(f => ({ ...f, mannequin_image: '' }))}>
                      <X className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* AI Human Model section */}
              <div className="rounded-lg border border-border/50 p-3 space-y-2 bg-secondary/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-primary" /> Real Human Model</Label>
                    <p className="text-xs text-muted-foreground">AI dresses garment on a realistic human model. Same body-region rules apply.</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" variant="outline" disabled={uploadingField === 'human_model_image'} asChild>
                      <label className="cursor-pointer">
                        {uploadingField === 'human_model_image' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        <span className="ml-1.5">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'human_model_image')} />
                      </label>
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => runGenerate('human')} disabled={generatingHuman || !form.image}>
                      {generatingHuman ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <User className="h-3.5 w-3.5" />}
                      <span className="ml-1.5">{form.human_model_image ? 'Regenerate' : 'AI Generate'}</span>
                    </Button>
                  </div>
                </div>
                {form.human_model_image && (
                  <div className="flex items-start gap-3">
                    <img src={form.human_model_image} alt="Human model preview" className="w-24 h-32 object-cover rounded-md bg-muted" />
                    <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => setForm(f => ({ ...f, human_model_image: '' }))}>
                      <X className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* AI 360° section */}
              <div className="rounded-lg border border-border/50 p-3 space-y-2 bg-secondary/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Label className="flex items-center gap-1.5"><RotateCw className="h-3.5 w-3.5 text-primary" /> 360° View</Label>
                    <p className="text-xs text-muted-foreground">12 frames user can drag-rotate. Pick which base to wrap around.</p>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Select value={rotationBase} onValueChange={(v: any) => setRotationBase(v)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mannequin">Mannequin</SelectItem>
                        <SelectItem value="human">Human model</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" variant="outline" onClick={handleGenerate360} disabled={generating360}>
                      {generating360 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                      <span className="ml-1.5">{form.rotation_frames.length > 0 ? 'Regenerate' : 'Generate'}</span>
                    </Button>
                  </div>
                </div>
                {generating360 && (
                  <p className="text-xs text-muted-foreground">Generating 12 frames sequentially… ~1–2 min.</p>
                )}
                {form.rotation_frames.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{form.rotation_frames.length} frames</p>
                    <div className="flex gap-1.5 overflow-x-auto">
                      {form.rotation_frames.map((url, i) => (
                        <img key={i} src={url} alt={`Frame ${i + 1}`} className="w-12 h-16 object-cover rounded bg-muted flex-shrink-0" />
                      ))}
                    </div>
                    <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => setForm(f => ({ ...f, rotation_frames: [] }))}>
                      <X className="h-3.5 w-3.5 mr-1" /> Remove all frames
                    </Button>
                  </div>
                )}
              </div>


              <div>
                <Label>Sizes (comma-separated) *</Label>
                <Input value={sizesInput} onChange={e => setSizesInput(e.target.value)} placeholder="S, M, L, XL" />
              </div>
              <ColorVariantsEditor
                value={(form.colors as ColorVariant[]) || []}
                onChange={(next) => setForm(f => ({ ...f, colors: next }))}
              />
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="bestseller, trending" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="in-stock"
                  checked={form.in_stock}
                  onCheckedChange={(checked) => setForm({ ...form, in_stock: !!checked })}
                />
                <Label htmlFor="in-stock">In Stock</Label>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingId ? 'Update Product' : 'Add Product'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No products yet. Add your first product!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-md bg-muted flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {product.brand}{product.subcategory ? ` | ${product.subcategory}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-sm">Rs.{Number(product.price).toLocaleString('en-IN')}</span>
                      <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditForm(product)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirm(product.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <Badge variant="destructive" className="text-[10px] ml-auto">Low Stock ({product.stock_quantity})</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-3 mt-2">
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
