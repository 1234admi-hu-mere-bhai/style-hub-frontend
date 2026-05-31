import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Sparkles, Loader2, Image as ImageIcon, Download, Tag } from 'lucide-react';

const COLLAR_TAG_PATH = 'assets/collar-tag.png';

interface Props {
  /** When provided, "Save to product" buttons appear and write to that product. */
  productId?: string;
  /** Optional callback so caller can mirror the URLs (e.g. attach to product images list). */
  onGenerated?: (urls: { front?: string; back?: string }) => void;
}

async function uploadToBucket(file: Blob, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/png' });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

/** Sample average color from an image URL (best effort, ignores CORS failures). */
async function sampleAverageHex(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        const s = 32;
        c.width = s; c.height = s;
        const ctx = c.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, s, s);
        const { data } = ctx.getImageData(0, 0, s, s);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
        const toHex = (v: number) => Math.round(v / n).toString(16).padStart(2, '0');
        resolve('#' + toHex(r) + toHex(g) + toHex(b));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function FabricToShirtStudio({ productId, onGenerated }: Props) {
  const [fabricUrl, setFabricUrl] = useState<string>('');
  const [collarTagUrl, setCollarTagUrl] = useState<string>('');
  const [colorHex, setColorHex] = useState<string>('');
  const [autoColor, setAutoColor] = useState(true);
  const [uploading, setUploading] = useState<'fabric' | 'tag' | null>(null);
  const [generating, setGenerating] = useState<'front' | 'back' | null>(null);
  const [frontUrl, setFrontUrl] = useState<string>('');
  const [backUrl, setBackUrl] = useState<string>('');
  const fabricInput = useRef<HTMLInputElement>(null);
  const tagInput = useRef<HTMLInputElement>(null);

  // Load existing collar tag if previously uploaded
  useEffect(() => {
    const { data } = supabase.storage.from('product-images').getPublicUrl(COLLAR_TAG_PATH);
    // probe with HEAD
    fetch(data.publicUrl, { method: 'HEAD' }).then(r => {
      if (r.ok) setCollarTagUrl(data.publicUrl + '?t=' + Date.now());
    }).catch(() => {});
  }, []);

  // Auto-sample color when fabric changes
  useEffect(() => {
    if (!fabricUrl || !autoColor) return;
    sampleAverageHex(fabricUrl).then(hex => { if (hex) setColorHex(hex); });
  }, [fabricUrl, autoColor]);

  const handleFabricFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading('fabric');
    try {
      const url = await uploadToBucket(file, `fabric-uploads/${crypto.randomUUID()}-${file.name}`);
      setFabricUrl(url);
      setFrontUrl(''); setBackUrl('');
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally { setUploading(null); }
  };

  const handleTagFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading('tag');
    try {
      const url = await uploadToBucket(file, COLLAR_TAG_PATH);
      setCollarTagUrl(url + '?t=' + Date.now());
      toast({ title: 'Collar tag saved', description: 'It will be overlaid on every front-view shirt.' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally { setUploading(null); }
  };

  const generate = async (view: 'front' | 'back') => {
    if (!fabricUrl) { toast({ title: 'Upload a fabric image first', variant: 'destructive' }); return; }
    setGenerating(view);
    try {
      const { data, error } = await supabase.functions.invoke('generate-shirt-from-fabric', {
        body: {
          fabricUrl,
          view,
          colorHex: colorHex || undefined,
          collarTagUrl: view === 'front' ? (collarTagUrl?.split('?')[0] || undefined) : undefined,
          productId,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No image returned');
      if (view === 'front') setFrontUrl(data.url); else setBackUrl(data.url);
      onGenerated?.({ front: view === 'front' ? data.url : frontUrl, back: view === 'back' ? data.url : backUrl });
      toast({ title: `${view === 'front' ? 'Front' : 'Back'} mockup ready` });
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally { setGenerating(null); }
  };

  const saveToProduct = async () => {
    if (!productId) return;
    if (!frontUrl && !backUrl) { toast({ title: 'Generate at least one view first', variant: 'destructive' }); return; }
    try {
      const { data: prod, error: fetchErr } = await supabase.from('products').select('image, additional_images').eq('id', productId).maybeSingle();
      if (fetchErr) throw fetchErr;
      const existingAdditional: string[] = (prod?.additional_images as any) || [];
      const newAdditional = [...existingAdditional];
      const newImage = !prod?.image && frontUrl ? frontUrl : prod?.image;
      [frontUrl, backUrl].filter(Boolean).forEach(u => { if (u && u !== newImage && !newAdditional.includes(u)) newAdditional.push(u); });
      const { error } = await supabase.functions.invoke('admin-products', {
        body: { action: 'update', product: { id: productId, image: newImage, additional_images: newAdditional } },
      });
      if (error) throw error;
      toast({ title: 'Saved to product images' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Inputs row */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Fabric upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Fabric design</Label>
              <input ref={fabricInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleFabricFile(e.target.files?.[0])} />
              <Button type="button" variant="outline" className="w-full h-12" onClick={() => fabricInput.current?.click()} disabled={uploading === 'fabric'}>
                {uploading === 'fabric' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {fabricUrl ? 'Replace fabric' : 'Upload fabric image'}
              </Button>
              {fabricUrl && <img src={fabricUrl} alt="Fabric" className="w-full h-28 object-cover rounded-md border" />}
            </div>

            {/* Collar tag */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-primary" /> Collar tag <span className="text-xs text-muted-foreground">(reused on every shirt)</span></Label>
              <input ref={tagInput} type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleTagFile(e.target.files?.[0])} />
              <Button type="button" variant="outline" className="w-full h-12" onClick={() => tagInput.current?.click()} disabled={uploading === 'tag'}>
                {uploading === 'tag' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {collarTagUrl ? 'Replace collar tag' : 'Upload collar tag PNG'}
              </Button>
              {collarTagUrl
                ? <img src={collarTagUrl} alt="Collar tag" className="h-28 object-contain rounded-md border bg-secondary/40 mx-auto" />
                : <p className="text-xs text-muted-foreground">Transparent PNG recommended. Without this, front view ships without a tag.</p>}
            </div>
          </div>

          {/* Color lock */}
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label>Lock shirt color (hex)</Label>
              <div className="flex gap-2">
                <Input value={colorHex} onChange={(e) => { setAutoColor(false); setColorHex(e.target.value); }} placeholder="#5a6f8a" className="h-12 bg-secondary/40 font-mono" />
                <input type="color" value={colorHex || '#888888'} onChange={(e) => { setAutoColor(false); setColorHex(e.target.value); }} className="h-12 w-14 rounded-md border bg-secondary/40 cursor-pointer" />
              </div>
              <p className="text-xs text-muted-foreground">
                {autoColor ? 'Auto-sampled from fabric. Edit to override.' : 'Manual override active.'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setAutoColor(true); if (fabricUrl) sampleAverageHex(fabricUrl).then(h => h && setColorHex(h)); }}>
              Re-sample
            </Button>
          </div>

          {/* Generate buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" onClick={() => generate('front')} disabled={!fabricUrl || generating !== null} className="h-12">
              {generating === 'front' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Front
            </Button>
            <Button type="button" onClick={() => generate('back')} disabled={!fabricUrl || generating !== null} variant="secondary" className="h-12">
              {generating === 'back' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Back
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(frontUrl || backUrl) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[{ url: frontUrl, label: 'Front (with collar tag)' }, { url: backUrl, label: 'Back' }].map((v) => v.url ? (
            <Card key={v.label}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{v.label}</Badge>
                  <a href={v.url} download target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                    <Download className="h-3 w-3" /> Download
                  </a>
                </div>
                <img src={v.url} alt={v.label} className="w-full aspect-square object-contain rounded-md bg-white" />
              </CardContent>
            </Card>
          ) : null)}
        </div>
      )}

      {productId && (frontUrl || backUrl) && (
        <Button type="button" onClick={saveToProduct} className="w-full h-12">
          <ImageIcon className="h-4 w-4 mr-2" /> Save to this product's images
        </Button>
      )}
    </div>
  );
}
