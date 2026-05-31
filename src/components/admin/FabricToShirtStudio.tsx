import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Sparkles, Loader2, Image as ImageIcon, Download, Tag, Info } from 'lucide-react';

const COLLAR_TAG_PATH = 'assets/collar-tag.png';

// Men's regular-fit size chart (inches). Editable per generation.
const SIZE_CHART: Record<string, { chest: number; length: number; sleeve: number; shoulder: number }> = {
  S:   { chest: 38, length: 28, sleeve: 24,   shoulder: 17   },
  M:   { chest: 40, length: 29, sleeve: 24.5, shoulder: 17.5 },
  L:   { chest: 42, length: 30, sleeve: 25,   shoulder: 18   },
  XL:  { chest: 44, length: 31, sleeve: 25.5, shoulder: 18.5 },
  XXL: { chest: 46, length: 32, sleeve: 26,   shoulder: 19   },
  '3XL': { chest: 48, length: 33, sleeve: 26.5, shoulder: 19.5 },
  '4XL': { chest: 50, length: 34, sleeve: 27,   shoulder: 20   },
};

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
  const [hd, setHd] = useState(true);
  const [uploading, setUploading] = useState<'fabric' | 'tag' | null>(null);
  const [generating, setGenerating] = useState<'front' | 'back' | 'spec' | null>(null);
  const [frontUrl, setFrontUrl] = useState<string>('');
  const [backUrl, setBackUrl] = useState<string>('');
  const [specUrl, setSpecUrl] = useState<string>('');
  const [specs, setSpecs] = useState({ size: 'M', chest: SIZE_CHART.M.chest, length: SIZE_CHART.M.length, sleeve: SIZE_CHART.M.sleeve, shoulder: SIZE_CHART.M.shoulder, fabric: 'Premium cotton blend' });
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

  const generate = async (view: 'front' | 'back' | 'spec') => {
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
          hd,
          specs: view === 'spec' ? specs : undefined,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No image returned');
      if (view === 'front') setFrontUrl(data.url);
      else if (view === 'back') setBackUrl(data.url);
      else setSpecUrl(data.url);
      onGenerated?.({ front: view === 'front' ? data.url : frontUrl, back: view === 'back' ? data.url : backUrl });
      toast({ title: `${view === 'front' ? 'Front' : view === 'back' ? 'Back' : 'Spec sheet'} ready` });
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally { setGenerating(null); }
  };

  const downloadOne = async (url: string, name: string) => {
    try {
      const r = await fetch(url);
      const b = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch { window.open(url, '_blank'); }
  };

  const downloadAll = async () => {
    const stamp = Date.now();
    if (frontUrl) await downloadOne(frontUrl, `muffigout-shirt-front-${stamp}.png`);
    if (backUrl) await downloadOne(backUrl, `muffigout-shirt-back-${stamp}.png`);
    if (specUrl) await downloadOne(specUrl, `muffigout-shirt-spec-${stamp}.png`);
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

          {/* HD toggle */}
          <div className="flex items-center justify-between rounded-md border bg-secondary/40 px-3 py-2">
            <div>
              <Label className="cursor-pointer">High-Definition output</Label>
              <p className="text-xs text-muted-foreground">Ultra-sharp 4K studio quality. Slightly slower.</p>
            </div>
            <Switch checked={hd} onCheckedChange={setHd} />
          </div>

          {/* Spec sheet inputs */}
          <div className="rounded-md border bg-secondary/40 p-3 space-y-3">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              <Label className="text-sm">Spec sheet measurements (inches)</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Size</Label>
                <Select
                  value={specs.size}
                  onValueChange={(v) => {
                    const m = SIZE_CHART[v];
                    setSpecs(s => m ? { ...s, size: v, ...m } : { ...s, size: v });
                  }}
                >
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(SIZE_CHART).map(sz => <SelectItem key={sz} value={sz}>{sz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Chest (in)</Label><Input className="h-10" type="number" step="0.5" value={specs.chest} onChange={e => setSpecs(s => ({ ...s, chest: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">Length (in)</Label><Input className="h-10" type="number" step="0.5" value={specs.length} onChange={e => setSpecs(s => ({ ...s, length: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">Sleeve (in)</Label><Input className="h-10" type="number" step="0.5" value={specs.sleeve} onChange={e => setSpecs(s => ({ ...s, sleeve: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">Shoulder (in)</Label><Input className="h-10" type="number" step="0.5" value={specs.shoulder} onChange={e => setSpecs(s => ({ ...s, shoulder: Number(e.target.value) }))} /></div>
              <div className="col-span-2 sm:col-span-1"><Label className="text-xs">Fabric</Label><Input className="h-10" value={specs.fabric} onChange={e => setSpecs(s => ({ ...s, fabric: e.target.value }))} /></div>
            </div>
            <p className="text-xs text-muted-foreground">Pick a size to auto-fill the standard measurements. Override any field if your sample differs.</p>
          </div>

          {/* Generate buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button type="button" onClick={() => generate('front')} disabled={!fabricUrl || generating !== null} className="h-12">
              {generating === 'front' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Front
            </Button>
            <Button type="button" onClick={() => generate('back')} disabled={!fabricUrl || generating !== null} variant="secondary" className="h-12">
              {generating === 'back' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Back
            </Button>
            <Button type="button" onClick={() => generate('spec')} disabled={!fabricUrl || generating !== null} variant="outline" className="h-12">
              {generating === 'spec' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Info className="h-4 w-4 mr-2" />}
              Spec Sheet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(frontUrl || backUrl || specUrl) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2 rounded-md bg-secondary/40 p-3 text-sm">
              <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">About this mockup</p>
                <p className="text-xs text-muted-foreground">
                  Men's full-sleeve button-down shirt rendered from your fabric swatch.
                  Color locked to <span className="font-mono text-foreground">{colorHex || 'auto-sampled'}</span>,
                  pattern reproduced from the fabric, MUFFI GOUT collar tag at the back-neck and a tonal MG monogram embroidered on the chest pocket (front view).
                  Spec sheet matches the same fabric color & pattern, sized for <span className="font-medium text-foreground">{specs.size}</span> — Chest {specs.chest}″, Length {specs.length}″, Sleeve {specs.sleeve}″, Shoulder {specs.shoulder}″ ({specs.fabric}).
                  and the spec sheet annotated with size {specs.size} — Chest {specs.chest}″, Length {specs.length}″, Sleeve {specs.sleeve}″, Shoulder {specs.shoulder}″ ({specs.fabric}).
                  {hd ? ' Generated in HD (4K studio quality).' : ' Standard quality — toggle HD above for sharper output.'}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { url: frontUrl, label: 'Front (with collar tag)', key: 'front' },
                { url: backUrl, label: 'Back', key: 'back' },
                { url: specUrl, label: 'Spec Sheet', key: 'spec' },
              ].map((v) => v.url ? (
                <div key={v.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{v.label}</Badge>
                    <button onClick={() => downloadOne(v.url, `muffigout-shirt-${v.key}.png`)} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                      <Download className="h-3 w-3" /> Download
                    </button>
                  </div>
                  <img src={v.url} alt={v.label} className="w-full aspect-square object-contain rounded-md bg-white border" />
                </div>
              ) : null)}
            </div>

            {(frontUrl && backUrl && specUrl) && (
              <Button type="button" variant="outline" onClick={downloadAll} className="w-full h-11">
                <Download className="h-4 w-4 mr-2" /> Download all 3 views
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {productId && (frontUrl || backUrl || specUrl) && (
        <Button type="button" onClick={saveToProduct} className="w-full h-12">
          <ImageIcon className="h-4 w-4 mr-2" /> Save to this product's images
        </Button>
      )}
    </div>
  );
}
