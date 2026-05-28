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
  images?: string[]; // additional photos for this color (the gallery scrolls through these)
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

// HSL -> RGB (h: 0..360, s/l: 0..1) -> 0..255 RGB
const hslToRgb = (h: number, s: number, l: number) => {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(hk(h + 1 / 3) * 255), Math.round(hk(h) * 255), Math.round(hk(h - 1 / 3) * 255)];
};

// Detect dominant garment color.
// Strategy: focus on center crop (skip background-heavy edges), bucket pixels by HUE
// (so shadows + highlights of the same color all vote for the same bucket), pick the
// bucket with the most saturated-pixel votes, then output a *display-friendly* color
// at moderate lightness (not the average — averaging mixes shadows and washes the color out).
const analyzeDominant = (url: string): Promise<string> => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      // 24 hue buckets (15° each). Track saturation-weighted votes + sum of S and L of voting pixels.
      const HUE_BUCKETS = 24;
      const hueVotes = new Array(HUE_BUCKETS).fill(0).map(() => ({ w: 0, s: 0, l: 0, n: 0 }));
      // Grayscale (sat<threshold) tracked separately; vote only when truly no color exists
      const gray = { w: 0, l: 0 };

      const cx = size / 2, cy = size / 2;
      const maxDist = Math.hypot(cx, cy);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue;
          const { h, s, l } = rgbToHsl(r, g, b);
          if (l > 0.96) continue; // skip pure white
          if (l < 0.04) continue; // skip pure black
          // Center weight: pixels near center matter more (garment is usually centered)
          const dist = Math.hypot(x - cx, y - cy) / maxDist;
          const centerW = 1.4 - dist; // 1.4 at center, 0.4 at corners
          if (s < 0.12) {
            gray.w += centerW * 0.3;
            gray.l += l * centerW * 0.3;
            continue;
          }
          const bucket = Math.floor((h / 360) * HUE_BUCKETS) % HUE_BUCKETS;
          const w = centerW * (0.3 + s * 2); // strongly favor saturated pixels
          hueVotes[bucket].w += w;
          hueVotes[bucket].s += s * w;
          hueVotes[bucket].l += l * w;
          hueVotes[bucket].n += 1;
        }
      }

      // Pick best hue bucket
      let bestIdx = -1, bestW = 0;
      hueVotes.forEach((v, i) => { if (v.w > bestW) { bestW = v.w; bestIdx = i; } });

      // If no saturated hue won, fall back to greyscale average
      if (bestIdx === -1 || hueVotes[bestIdx].w < gray.w * 0.5) {
        const lAvg = gray.w > 0 ? gray.l / gray.w : 0.5;
        const v = Math.round(lAvg * 255);
        resolve(rgbToHex(v, v, v));
        return;
      }

      const best = hueVotes[bestIdx];
      // Hue: center of the winning bucket (could also weighted-avg neighbors, but bucket center is robust)
      const hue = (bestIdx + 0.5) * (360 / HUE_BUCKETS);
      const sat = best.s / best.w;
      let light = best.l / best.w;
      // Clamp lightness to a display-friendly range so very dark garments still show their real color
      // (shadows pull the avg down; bumping mid-shadows up reveals the actual hue)
      if (light < 0.18) light = 0.18 + light * 0.5;
      if (light > 0.78) light = 0.78;
      const [r, g, b] = hslToRgb(hue, Math.min(1, sat * 1.1), light);
      resolve(rgbToHex(r, g, b));
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
