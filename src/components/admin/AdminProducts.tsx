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
import { Plus, Pencil, Trash2, Package, Loader2, X } from 'lucide-react';

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
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [additionalImagesInput, setAdditionalImagesInput] = useState('');

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
    });
    setSizesInput((product.sizes || []).join(', '));
    setColorsInput(
      (product.colors || []).map((c: any) =>
        typeof c === 'string' ? c : `${c.name}:${c.hex}${c.image ? ':' + c.image : ''}`
      ).join(', ')
    );
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
      const colors = colorsInput.split(',').map(c => {
        const trimmed = c.trim();
        const parts = trimmed.split(':');
        if (parts.length >= 3) {
          return { name: parts[0].trim(), hex: parts[1].trim(), image: parts.slice(2).join(':').trim() };
        } else if (parts.length === 2) {
          return { name: parts[0].trim(), hex: parts[1].trim() };
        }
        return { name: trimmed, hex: '' };
      }).filter(c => c.name);
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
              <div>
                <Label>Image URL *</Label>
                <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://... or /assets/product-1.jpg" />
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
                <Input value={additionalImagesInput} onChange={e => setAdditionalImagesInput(e.target.value)} placeholder="https://img1.png, https://img2.png" />
              </div>
              <div>
                <Label>Sizes (comma-separated) *</Label>
                <Input value={sizesInput} onChange={e => setSizesInput(e.target.value)} placeholder="S, M, L, XL" />
              </div>
              <div>
                <Label>Colors with Images (Name:Hex:ImageURL, comma-separated)</Label>
                <p className="text-xs text-muted-foreground mb-1.5">Format: ColorName:HexCode:ImageURL — image URL is optional. Each color can have its own image that shows when selected.</p>
                <Textarea
                  value={colorsInput}
                  onChange={e => setColorsInput(e.target.value)}
                  placeholder="Blue:#3B82F6:https://img-blue.jpg, Black:#111111:https://img-black.jpg, Red:#EF4444"
                  rows={3}
                />
              </div>
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
