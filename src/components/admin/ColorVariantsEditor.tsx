import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Palette, RefreshCw } from 'lucide-react';

export interface ColorVariant {
  name: string;
  hex: string;
  image?: string;
}

interface Props {
  value: ColorVariant[];
  onChange: (next: ColorVariant[]) => void;
}

// Curated color name map (nearest match by RGB distance). Names are matched case-insensitively.
const NAMED_COLORS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#1a1a1a' }, { name: 'White', hex: '#f5f5f5' },
  { name: 'Grey', hex: '#808080' }, { name: 'Gray', hex: '#808080' },
  { name: 'Charcoal', hex: '#36454f' },
  { name: 'Navy', hex: '#1e3a5f' }, { name: 'Blue', hex: '#3b82f6' },
  { name: 'Sky Blue', hex: '#7dd3fc' }, { name: 'Teal', hex: '#14b8a6' },
  { name: 'Green', hex: '#22c55e' }, { name: 'Dark Green', hex: '#15402b' },
  { name: 'Olive', hex: '#4a5d23' }, { name: 'Forest', hex: '#1a3c2a' },
  { name: 'Mint', hex: '#a7f3d0' }, { name: 'Yellow', hex: '#facc15' },
  { name: 'Mustard', hex: '#c9a227' }, { name: 'Beige', hex: '#d4c3a3' },
  { name: 'Brown', hex: '#78350f' }, { name: 'Tan', hex: '#b8865b' },
  { name: 'Orange', hex: '#f97316' }, { name: 'Coral', hex: '#ff6b6b' },
  { name: 'Red', hex: '#ef4444' }, { name: 'Maroon', hex: '#7f1d1d' },
  { name: 'Pink', hex: '#ec4899' }, { name: 'Lavender', hex: '#c4b5fd' },
  { name: 'Purple', hex: '#9333ea' }, { name: 'Cream', hex: '#fef9c3' },
];

const rgbDist = (a: number[], b: number[]) =>
  Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));

const hexToRgb = (hex: string): number[] => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return [128, 128, 128];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const nearestName = (hex: string) => {
  const rgb = hexToRgb(hex);
  let best = NAMED_COLORS[0]; let bestD = Infinity;
  for (const c of NAMED_COLORS) {
    const d = rgbDist(rgb, hexToRgb(c.hex));
    if (d < bestD) { bestD = d; best = c; }
  }
  return best.name;
};

// Lookup hex from a typed name (case-insensitive, allows fuzzy contains)
const nameToHex = (name: string): string | null => {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  const exact = NAMED_COLORS.find(c => c.name.toLowerCase() === n);
  if (exact) return exact.hex;
  const partial = NAMED_COLORS.find(c => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase()));
  return partial ? partial.hex : null;
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return { h, s, l };
};

// Analyze dominant color: skip background-like pixels (very light/dark/desaturated)
// and weight remaining pixels by saturation so vivid garments win over neutrals.
const analyzeDominant = (url: string): Promise<string> => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const size = 96;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      const buckets = new Map<string, { r: number; g: number; b: number; w: number }>();
      const fallback = { r: 0, g: 0, b: 0, w: 0 };
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 200) continue;
        const { s, l } = rgbToHsl(r, g, b);
        if (l > 0.94) continue; // skip near-white background
        if (l < 0.06) continue; // skip near-black shadows
        fallback.r += r; fallback.g += g; fallback.b += b; fallback.w += 1;
        // Skip near-greys at mid lightness (likely pants/shadow)
        if (s < 0.15 && l > 0.18 && l < 0.85) continue;
        const w = 0.4 + s * 1.5; // weight by saturation
        const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
        const cur = buckets.get(key) || { r: 0, g: 0, b: 0, w: 0 };
        cur.r += r * w; cur.g += g * w; cur.b += b * w; cur.w += w;
        buckets.set(key, cur);
      }
      let bestW = 0; let best: { r: number; g: number; b: number; w: number } | null = null;
      buckets.forEach(v => { if (v.w > bestW) { bestW = v.w; best = v; } });
      const winner = best ?? (fallback.w > 0 ? fallback : { r: 128, g: 128, b: 128, w: 1 });
      resolve(rgbToHex(winner.r / winner.w, winner.g / winner.w, winner.b / winner.w));
    } catch (e) { reject(e); }
  };
  img.onerror = () => reject(new Error('Image load failed'));
  img.src = url;
});

const SLOT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

const ColorVariantsEditor = ({ value, onChange }: Props) => {
  const [slotCount, setSlotCount] = useState(() => {
    const v = value?.length || 0;
    return SLOT_OPTIONS.find(n => n >= Math.max(v, 3)) || 5;
  });
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ensure value array length matches slotCount (pad with blanks, trim extras only if trailing blanks)
  useEffect(() => {
    if (value.length < slotCount) {
      const padded = [...value];
      while (padded.length < slotCount) padded.push({ name: '', hex: '', image: '' });
      onChange(padded);
    } else if (value.length > slotCount) {
      // Trim only trailing empties
      const trimmed = [...value];
      while (trimmed.length > slotCount && !trimmed[trimmed.length - 1]?.image && !trimmed[trimmed.length - 1]?.name) {
        trimmed.pop();
      }
      if (trimmed.length !== value.length) onChange(trimmed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotCount]);

  const updateSlot = (idx: number, patch: Partial<ColorVariant>) => {
    const next = [...value];
    next[idx] = { ...(next[idx] || { name: '', hex: '', image: '' }), ...patch };
    onChange(next);
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `uploads/color-variants/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const handleFile = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const url = await uploadToStorage(file);
      let hex = '#808080'; let name = '';
      try {
        hex = await analyzeDominant(url);
        name = nearestName(hex);
      } catch { /* keep defaults */ }
      updateSlot(idx, { image: url, hex, name: value[idx]?.name || name });
      toast({ title: `Slot ${idx + 1} uploaded`, description: `Detected ${name || 'color'} ${hex}` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingIdx(null);
    }
  };

  const redetect = async (idx: number) => {
    const url = value[idx]?.image;
    if (!url) return;
    setUploadingIdx(idx);
    try {
      const hex = await analyzeDominant(url);
      updateSlot(idx, { hex, name: nearestName(hex) });
      toast({ title: `Re-analyzed`, description: `Slot ${idx + 1} → ${hex}` });
    } catch (err: any) {
      toast({ title: 'Analyze failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingIdx(null);
    }
  };

  const clearSlot = (idx: number) => updateSlot(idx, { name: '', hex: '', image: '' });

  const slots = Array.from({ length: slotCount }, (_, i) => value[i] || { name: '', hex: '', image: '' });
  const filled = slots.filter(s => s.image).length;

  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-3 bg-secondary/20">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Label className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-primary" /> Color Variants</Label>
          <p className="text-xs text-muted-foreground">Upload one image per color/pattern. Color is auto-detected; you can rename.</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Slots:</Label>
          <Select value={String(slotCount)} onValueChange={v => setSlotCount(Number(v))}>
            <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SLOT_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{filled}/{slotCount} filled</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {slots.map((slot, idx) => (
          <div key={idx} className="rounded-md border border-border/60 bg-background/60 p-2 flex flex-col gap-1.5 relative">
            <div className="text-[10px] text-muted-foreground font-medium">Slot {idx + 1}</div>
            {slot.image ? (
              <>
                <div className="relative w-full aspect-square rounded overflow-hidden bg-muted">
                  <img src={slot.image} alt={slot.name || `Slot ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => clearSlot(idx)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/90 text-destructive flex items-center justify-center hover:bg-background"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-border/60 flex-shrink-0"
                    style={{ background: slot.hex || '#ccc' }}
                  />
                  <Input
                    value={slot.name}
                    onChange={e => {
                      const name = e.target.value;
                      const matchedHex = nameToHex(name);
                      updateSlot(idx, matchedHex ? { name, hex: matchedHex } : { name });
                    }}
                    placeholder="Color name"
                    className="h-7 text-xs px-1.5"
                  />
                </div>
                <Input
                  value={slot.hex}
                  onChange={e => updateSlot(idx, { hex: e.target.value })}
                  placeholder="#hex"
                  className="h-7 text-xs px-1.5 font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] gap-1"
                  disabled={uploadingIdx === idx}
                  onClick={() => redetect(idx)}
                >
                  {uploadingIdx === idx ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Re-detect
                </Button>
              </>
            ) : (
              <label className="cursor-pointer w-full aspect-square rounded border-2 border-dashed border-border/60 hover:border-primary/60 hover:bg-secondary/40 flex flex-col items-center justify-center gap-1 transition-colors">
                {uploadingIdx === idx ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Upload</span>
                  </>
                )}
                <input
                  ref={el => (fileRefs.current[idx] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(idx, f);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorVariantsEditor;
