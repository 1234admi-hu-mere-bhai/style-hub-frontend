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
import { Upload, Sparkles, Loader2, Image as ImageIcon, Download, Tag, Info, Shirt, User, Copy, ClipboardCopy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Spin360Viewer from './Spin360Viewer';

type ViewKind = 'front' | 'back' | 'spec' | 'highlights' | 'model' | 'model-back' | 'lifestyle' | 'mannequin' | 'rotation-360';
type Pose =
  | 'sitting' | 'leaning' | 'walking' | 'coffee'
  | 'standing-hands-pockets' | 'arms-crossed' | 'hand-in-hair' | 'looking-away'
  | 'jacket-over-shoulder' | 'on-bike' | 'on-stairs' | 'against-car'
  | 'rooftop' | 'beach-walk' | 'forest-path' | 'studio-profile'
  | 'laughing' | 'phone-call' | 'reading-book' | 'sunglasses-pose'
  | 'denim-jacket-layered' | 'window-light' | 'graffiti-wall' | 'train-station';

const POSE_OPTIONS: Array<{ value: Pose; label: string }> = [
  { value: 'sitting', label: 'Sitting on a clean white table' },
  { value: 'leaning', label: 'Leaning against a concrete wall' },
  { value: 'walking', label: 'Walking through a sunlit corridor' },
  { value: 'coffee', label: 'Seated at a cafe table' },
  { value: 'standing-hands-pockets', label: 'Standing — hands in pockets' },
  { value: 'arms-crossed', label: 'Standing — arms crossed' },
  { value: 'hand-in-hair', label: 'Hand running through hair' },
  { value: 'looking-away', label: 'Three-quarter, looking away' },
  { value: 'jacket-over-shoulder', label: 'Jacket slung over shoulder' },
  { value: 'on-bike', label: 'Sitting on a vintage bike' },
  { value: 'on-stairs', label: 'Sitting on stone stairs' },
  { value: 'against-car', label: 'Leaning against a classic car' },
  { value: 'rooftop', label: 'Rooftop golden-hour' },
  { value: 'beach-walk', label: 'Beach walk at sunset' },
  { value: 'forest-path', label: 'Forest path stroll' },
  { value: 'studio-profile', label: 'Studio side profile' },
  { value: 'laughing', label: 'Candid laughing' },
  { value: 'phone-call', label: 'On a phone call' },
  { value: 'reading-book', label: 'Reading a book on a bench' },
  { value: 'sunglasses-pose', label: 'Adjusting sunglasses' },
  { value: 'denim-jacket-layered', label: 'Layered with denim jacket' },
  { value: 'window-light', label: 'Window-light portrait' },
  { value: 'graffiti-wall', label: 'In front of a graffiti wall' },
  { value: 'train-station', label: 'Empty train station platform' },
];

const COLLAR_TAG_PATH = 'assets/collar-tag.png';

// Men's regular-fit size chart (inches). Editable per generation.
const SIZE_CHART: Record<string, { chest: number; length: number; sleeve: number; shoulder: number }> = {
  XS:  { chest: 36, length: 27, sleeve: 23.5, shoulder: 16.5 },
  S:   { chest: 38, length: 28, sleeve: 24,   shoulder: 17   },
  M:   { chest: 40, length: 29, sleeve: 24.5, shoulder: 17.5 },
  L:   { chest: 42, length: 30, sleeve: 25,   shoulder: 18   },
  XL:  { chest: 44, length: 31, sleeve: 25.5, shoulder: 18.5 },
  XXL: { chest: 46, length: 32, sleeve: 26,   shoulder: 19   },
  '3XL': { chest: 48, length: 33, sleeve: 26.5, shoulder: 19.5 },
  '4XL': { chest: 50, length: 34, sleeve: 27,   shoulder: 20   },
  '5XL': { chest: 52, length: 35, sleeve: 27.5, shoulder: 20.5 },
  '6XL': { chest: 54, length: 36, sleeve: 28,   shoulder: 21   },
};
const ALL_SIZES = Object.keys(SIZE_CHART);
const BULK_SPEC_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

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

async function getFunctionErrorMessage(error: any) {
  const context = error?.context;
  let backendMessage = '';
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      backendMessage = payload?.error || payload?.message || '';
    } catch {
      try { backendMessage = await context.clone().text(); } catch {}
    }
  } else {
    backendMessage = context?.error || context?.message || context?.details || '';
  }
  const raw = [backendMessage, error?.message].filter(Boolean).join(' — ') || 'Generation failed';
  if (/401|UNAUTHENTICATED|API key not valid|invalid authentication|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(raw)) {
    return 'The saved Gemini API key is not valid for generation. Please update it with a Google AI Studio API key.';
  }
  if (/RESOURCE_EXHAUSTED|quota exceeded|quota|rate.?limit|rate limited|429/i.test(raw)) return 'Your Gemini API quota is exhausted or not enabled for API billing. Gemini app Pro subscription does not include API quota — enable billing/quota for this API key, then try again.';
  if (/credits are exhausted|402/i.test(raw)) return 'Built-in image generation credits are exhausted. Add Cloud AI balance or use a Gemini API key with enabled API quota.';
  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
}

// Nearest named-color lookup for the hex input.
const NAMED_COLORS: Array<[string, string]> = [
  ['Black','#000000'],['White','#ffffff'],['Ivory','#fffff0'],['Cream','#fffdd0'],['Beige','#f5f5dc'],
  ['Sand','#c2b280'],['Khaki','#c3b091'],['Tan','#d2b48c'],['Camel','#c19a6b'],['Taupe','#483c32'],
  ['Brown','#8b4513'],['Chocolate','#5d3a1a'],['Coffee','#6f4e37'],['Maroon','#800000'],['Burgundy','#800020'],
  ['Wine','#722f37'],['Red','#e10600'],['Crimson','#dc143c'],['Coral','#ff7f50'],['Salmon','#fa8072'],
  ['Peach','#ffdab9'],['Orange','#ff7f00'],['Rust','#b7410e'],['Mustard','#d4a017'],['Gold','#d4af37'],
  ['Yellow','#ffd700'],['Lime','#bfff00'],['Olive','#708238'],['Sage','#9caf88'],['Mint','#98ff98'],
  ['Green','#2e8b57'],['Forest Green','#228b22'],['Emerald','#50c878'],['Teal','#008080'],['Aqua','#00ffff'],
  ['Sky Blue','#87ceeb'],['Powder Blue','#b0e0e6'],['Light Blue','#add8e6'],['Blue','#1e90ff'],['Royal Blue','#4169e1'],
  ['Navy','#1a2a4f'],['Midnight Blue','#191970'],['Denim','#4a6b8a'],['Slate','#708090'],['Steel Blue','#4682b4'],
  ['Indigo','#4b0082'],['Purple','#6a0dad'],['Violet','#8a2be2'],['Lavender','#b497bd'],['Lilac','#c8a2c8'],
  ['Mauve','#915f6d'],['Pink','#ffc0cb'],['Hot Pink','#ff69b4'],['Magenta','#c71585'],['Rose','#c08081'],
  ['Blush','#de5d83'],['Charcoal','#36454f'],['Graphite','#383838'],['Grey','#808080'],['Light Grey','#d3d3d3'],
  ['Silver','#c0c0c0'],['Off White','#faf9f6'],['Stone','#a8a39d'],
];
function nearestColorName(hex: string): string | null {
  const h = hex.trim().replace('#','');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  let best = NAMED_COLORS[0][0], bestD = Infinity;
  for (const [name, nhex] of NAMED_COLORS) {
    const nh = nhex.replace('#','');
    const dr = r - parseInt(nh.slice(0,2),16);
    const dg = g - parseInt(nh.slice(2,4),16);
    const db = b - parseInt(nh.slice(4,6),16);
    const d = dr*dr + dg*dg + db*db;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
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
  const [generating, setGenerating] = useState<ViewKind | null>(null);
  const [frontUrl, setFrontUrl] = useState<string>('');
  const [backUrl, setBackUrl] = useState<string>('');
  const [specUrl, setSpecUrl] = useState<string>('');
  const [highlightsUrl, setHighlightsUrl] = useState<string>('');
  const [modelUrl, setModelUrl] = useState<string>('');
  const [lifestyleUrl, setLifestyleUrl] = useState<string>('');
  const [modelBackUrl, setModelBackUrl] = useState<string>('');
  const [mannequinUrl, setMannequinUrl] = useState<string>('');
  const [rotation360Url, setRotation360Url] = useState<string>('');
  const [bulkSpec, setBulkSpec] = useState<{ size: string; url: string }[]>([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [pose, setPose] = useState<Pose>('sitting');
  const [userGeminiKey, setUserGeminiKey] = useState<string>(() => {
    try { return localStorage.getItem('fabric-studio:gemini-key') || ''; } catch { return ''; }
  });
  const [showKey, setShowKey] = useState(false);
  const [specs, setSpecs] = useState({
    size: 'M',
    chest: SIZE_CHART.M.chest, length: SIZE_CHART.M.length, sleeve: SIZE_CHART.M.sleeve, shoulder: SIZE_CHART.M.shoulder,
    fabric: 'Cotton Blend',
    fit: 'Regular',
    pattern: 'Solid',
    occasion: 'Casual',
    collar: 'Spread',
  });
  const fabricInput = useRef<HTMLInputElement>(null);
  const tagInput = useRef<HTMLInputElement>(null);
  const storageKey = `fabric-studio:${productId || 'global'}`;
  const hydrated = useRef(false);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [promptExports, setPromptExports] = useState<Array<{ view: ViewKind; label: string; prompt: string }>>([]);
  const [exportingPrompts, setExportingPrompts] = useState(false);
  const [promptMode, setPromptMode] = useState(false);

  // Persist Gemini key separately
  useEffect(() => {
    try {
      if (userGeminiKey) localStorage.setItem('fabric-studio:gemini-key', userGeminiKey);
      else localStorage.removeItem('fabric-studio:gemini-key');
    } catch {}
  }, [userGeminiKey]);

  // Restore previous session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.fabricUrl) setFabricUrl(s.fabricUrl);
        if (s.collarTagUrl) setCollarTagUrl(s.collarTagUrl);
        if (s.colorHex) setColorHex(s.colorHex);
        if (typeof s.autoColor === 'boolean') setAutoColor(s.autoColor);
        if (typeof s.hd === 'boolean') setHd(s.hd);
        if (s.specs) setSpecs(s.specs);
        if (s.pose) setPose(s.pose);
        if (s.frontUrl) setFrontUrl(s.frontUrl);
        if (s.backUrl) setBackUrl(s.backUrl);
        if (s.specUrl) setSpecUrl(s.specUrl);
        if (s.highlightsUrl) setHighlightsUrl(s.highlightsUrl);
        if (s.modelUrl) setModelUrl(s.modelUrl);
        if (s.modelBackUrl) setModelBackUrl(s.modelBackUrl);
        if (s.mannequinUrl) setMannequinUrl(s.mannequinUrl);
        if (s.rotation360Url) setRotation360Url(s.rotation360Url);
        if (Array.isArray(s.bulkSpec)) setBulkSpec(s.bulkSpec);
        if (s.lifestyleUrl) setLifestyleUrl(s.lifestyleUrl);
      }
    } catch {}
    hydrated.current = true;
  }, [storageKey]);

  // Auto-save on any state change
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        fabricUrl, collarTagUrl, colorHex, autoColor, hd, specs, pose,
        frontUrl, backUrl, specUrl, highlightsUrl, modelUrl, modelBackUrl, lifestyleUrl, mannequinUrl, rotation360Url, bulkSpec,
      }));
    } catch {}
  }, [storageKey, fabricUrl, collarTagUrl, colorHex, autoColor, hd, specs, pose, frontUrl, backUrl, specUrl, highlightsUrl, modelUrl, modelBackUrl, lifestyleUrl, mannequinUrl, rotation360Url, bulkSpec]);

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
      setFrontUrl(''); setBackUrl(''); setSpecUrl(''); setHighlightsUrl(''); setModelUrl(''); setModelBackUrl(''); setLifestyleUrl(''); setMannequinUrl(''); setRotation360Url(''); setBulkSpec([]);
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

  const generate = async (view: ViewKind) => {
    if (!fabricUrl) { toast({ title: 'Upload a fabric image first', variant: 'destructive' }); return; }
    if (!frontUrl && ['back', 'highlights', 'model', 'model-back', 'lifestyle', 'mannequin', 'rotation-360'].includes(view) && !promptMode) {
      toast({ title: 'Generate Front first', description: 'Other views now use the front mockup as the color and pattern reference to avoid mismatched results.', variant: 'destructive' });
      return;
    }
    if (promptMode) { await exportSinglePrompt(view); return; }
    setGenerating(view);
    try {
      const needsSpecs = view === 'spec' || view === 'highlights';
      const needsTag = view === 'front';
      const referenceImageUrl = view !== 'front' ? frontUrl || undefined : undefined;
      const { data, error } = await supabase.functions.invoke('generate-shirt-from-fabric', {
        body: {
          fabricUrl,
          view,
          colorHex: colorHex || undefined,
          collarTagUrl: needsTag ? (collarTagUrl?.split('?')[0] || undefined) : undefined,
          referenceImageUrl,
          productId,
          hd,
          specs: needsSpecs ? specs : undefined,
          pose: view === 'lifestyle' ? pose : undefined,
          userGeminiKey: userGeminiKey?.trim() || undefined,
        },
      });
      if (error) {
        throw new Error(await getFunctionErrorMessage(error));
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('No image returned');
      const setters: Record<ViewKind, (u: string) => void> = {
        front: setFrontUrl, back: setBackUrl, spec: setSpecUrl,
        highlights: setHighlightsUrl, model: setModelUrl, 'model-back': setModelBackUrl, lifestyle: setLifestyleUrl,
        mannequin: setMannequinUrl, 'rotation-360': setRotation360Url,
      };
      setters[view](data.url);
      onGenerated?.({ front: view === 'front' ? data.url : frontUrl, back: view === 'back' ? data.url : backUrl });
      const labels: Record<ViewKind, string> = {
        front: 'Front', back: 'Back', spec: 'Spec sheet',
        highlights: 'Key Highlights', model: 'Model (front)', 'model-back': 'Model (back)', lifestyle: 'Lifestyle pose',
        mannequin: 'Mannequin', 'rotation-360': '360° rotation',
      };
      toast({ title: `${labels[view]} ready` });
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
    const all: Array<[string, string]> = [
      [frontUrl, 'front'], [backUrl, 'back'], [specUrl, 'spec'],
      [highlightsUrl, 'highlights'], [modelUrl, 'model-front'], [modelBackUrl, 'model-back'],
      [lifestyleUrl, `lifestyle-${pose}`], [mannequinUrl, 'mannequin'], [rotation360Url, 'rotation-360'],
    ];
    for (const [url, key] of all) {
      if (url) await downloadOne(url, `muffigout-shirt-${key}-${stamp}.png`);
    }
    for (const item of bulkSpec) {
      await downloadOne(item.url, `muffigout-shirt-spec-${item.size}-${stamp}.png`);
    }
  };

  const generateAllSpecSizes = async () => {
    if (!fabricUrl) { toast({ title: 'Upload a fabric image first', variant: 'destructive' }); return; }
    setBulkGenerating(true);
    setBulkSpec([]);
    const results: { size: string; url: string }[] = [];
    try {
      for (const size of BULK_SPEC_SIZES) {
        const m = SIZE_CHART[size];
        const sizedSpecs = { ...specs, size, ...m };
        try {
          const { data, error } = await supabase.functions.invoke('generate-shirt-from-fabric', {
            body: { fabricUrl, view: 'spec', colorHex: colorHex || undefined, productId, hd, specs: sizedSpecs, userGeminiKey: userGeminiKey?.trim() || undefined },
          });
          if (error) {
            throw new Error(await getFunctionErrorMessage(error));
          }
          if (data?.error) throw new Error(data.error);
          if (data?.url) {
            results.push({ size, url: data.url });
            setBulkSpec([...results]);
            toast({ title: `Spec sheet ${size} ready (${results.length}/${BULK_SPEC_SIZES.length})` });
          }
        } catch (e: any) {
          toast({ title: `Spec ${size} failed`, description: e.message, variant: 'destructive' });
        }
      }
      toast({ title: `All ${results.length} spec sheets generated` });
    } finally { setBulkGenerating(false); }
  };



  const VIEW_LABELS: Record<ViewKind, string> = {
    front: 'Front (flat-lay)', back: 'Back (flat-lay)', spec: 'Spec Sheet',
    highlights: 'Key Highlights', model: 'Model — front', 'model-back': 'Model — back', lifestyle: `Lifestyle — ${pose}`,
    mannequin: 'Mannequin', 'rotation-360': '360° rotation',
  };

  // Per-view prompt export — opens dialog with just one prompt.
  const exportSinglePrompt = async (view: ViewKind) => {
    if (!fabricUrl) { toast({ title: 'Upload a fabric image first', variant: 'destructive' }); return; }
    setExportingPrompts(true);
    try {
      const needsSpecs = view === 'spec' || view === 'highlights';
      const { data, error } = await supabase.functions.invoke('generate-shirt-from-fabric', {
        body: {
          fabricUrl,
          view,
          colorHex: colorHex || undefined,
          referenceImageUrl: view !== 'front' ? frontUrl || undefined : undefined,
          productId,
          hd,
          specs: needsSpecs ? specs : undefined,
          pose: view === 'lifestyle' ? pose : undefined,
          promptOnly: true,
        },
      });
      if (error) throw new Error(await getFunctionErrorMessage(error));
      if (!data?.prompt) throw new Error('No prompt returned');
      setPromptExports([{ view, label: VIEW_LABELS[view], prompt: data.prompt }]);
      setPromptDialogOpen(true);
    } catch (e: any) {
      toast({ title: 'Could not build prompt', description: e.message, variant: 'destructive' });
    } finally { setExportingPrompts(false); }
  };

  // Export all prompts WITHOUT calling Gemini — copy/paste into any AI tool (Gemini app, AI Studio, ChatGPT, etc.)
  const exportPrompts = async () => {
    if (!fabricUrl) { toast({ title: 'Upload a fabric image first', variant: 'destructive' }); return; }
    setExportingPrompts(true);
    setPromptExports([]);
    const views: Array<{ view: ViewKind; label: string }> = [
      { view: 'front', label: 'Front (flat-lay)' },
      { view: 'back', label: 'Back (flat-lay)' },
      { view: 'spec', label: 'Spec Sheet' },
      { view: 'highlights', label: 'Key Highlights' },
      { view: 'model', label: 'Model — front' },
      { view: 'model-back', label: 'Model — back' },
      { view: 'lifestyle', label: `Lifestyle — ${pose}` },
      { view: 'mannequin', label: 'Mannequin' },
      { view: 'rotation-360', label: '360° rotation' },
    ];
    const results: typeof promptExports = [];
    try {
      for (const v of views) {
        try {
          const needsSpecs = v.view === 'spec' || v.view === 'highlights';
          const { data, error } = await supabase.functions.invoke('generate-shirt-from-fabric', {
            body: {
              fabricUrl,
              view: v.view,
              colorHex: colorHex || undefined,
              referenceImageUrl: v.view !== 'front' ? frontUrl || undefined : undefined,
              productId,
              hd,
              specs: needsSpecs ? specs : undefined,
              pose: v.view === 'lifestyle' ? pose : undefined,
              promptOnly: true,
            },
          });
          if (error) throw new Error(await getFunctionErrorMessage(error));
          if (data?.prompt) results.push({ view: v.view, label: v.label, prompt: data.prompt });
        } catch (e: any) {
          console.warn(`prompt export ${v.view} failed`, e?.message);
        }
      }
      setPromptExports(results);
      setPromptDialogOpen(true);
    } finally { setExportingPrompts(false); }
  };

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: 'Copied to clipboard' }); }
    catch { toast({ title: 'Copy failed', variant: 'destructive' }); }
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
              {nearestColorName(colorHex) && (
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: colorHex }} />
                  <span className="text-sm font-medium text-foreground">{nearestColorName(colorHex)}</span>
                  <span className="text-xs text-muted-foreground font-mono uppercase">{colorHex}</span>
                </div>
              )}
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

          {/* Unlimited generation via server-side Gemini key */}
          <div className="rounded-md border bg-secondary/40 p-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Gemini API routing enabled</p>
              <p className="text-xs text-muted-foreground">Uses your saved Gemini API key when Google API quota is active; quota errors now stop before fallback credits are used.</p>
            </div>
            <Badge variant="outline" className="text-[10px]">Gemini</Badge>
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

            {/* Key Highlights metadata — used on the hanger overlay */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <Label className="text-xs">Fit</Label>
                <Select value={specs.fit} onValueChange={(v) => setSpecs(s => ({ ...s, fit: v }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Regular','Slim','Relaxed','Oversized'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pattern</Label>
                <Select value={specs.pattern} onValueChange={(v) => setSpecs(s => ({ ...s, pattern: v }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Solid','Striped','Checked','Printed','Textured'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Occasion</Label>
                <Select value={specs.occasion} onValueChange={(v) => setSpecs(s => ({ ...s, occasion: v }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Casual','Formal','Party','Festive','Office'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Collar</Label>
                <Select value={specs.collar} onValueChange={(v) => setSpecs(s => ({ ...s, collar: v }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Spread','Button-down','Mandarin','Cuban','Classic'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Pick a size to auto-fill measurements. Fit/Pattern/Occasion/Collar render on the Key Highlights hanger shot.</p>
          </div>

          {/* Lifestyle pose selector */}
          <div className="rounded-md border bg-secondary/40 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <Label className="text-sm">Lifestyle pose (for stylish model shot)</Label>
            </div>
            <Select value={pose} onValueChange={(v) => setPose(v as Pose)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {POSE_OPTIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border bg-secondary/40 px-3 py-2">
              <div>
                <Label className="cursor-pointer">Prompt mode (no API)</Label>
                <p className="text-xs text-muted-foreground">When ON, clicking any view below opens its ready-to-paste prompt instead of calling the AI.</p>
              </div>
              <Switch checked={promptMode} onCheckedChange={setPromptMode} />
            </div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Garment views</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button type="button" onClick={() => generate('front')} disabled={!fabricUrl || generating !== null} className="h-11">
                {generating === 'front' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Front
              </Button>
              <Button type="button" onClick={() => generate('back')} disabled={!fabricUrl || (!promptMode && !frontUrl) || generating !== null} variant="secondary" className="h-11">
                {generating === 'back' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Back
              </Button>
              <Button type="button" onClick={() => generate('spec')} disabled={!fabricUrl || generating !== null} variant="outline" className="h-11">
                {generating === 'spec' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Info className="h-4 w-4 mr-2" />}
                Spec Sheet
              </Button>
              <Button type="button" onClick={() => generate('highlights')} disabled={!fabricUrl || (!promptMode && !frontUrl) || generating !== null} variant="outline" className="h-11">
                {generating === 'highlights' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shirt className="h-4 w-4 mr-2" />}
                Key Highlights
              </Button>
            </div>
            <Button type="button" onClick={generateAllSpecSizes} disabled={!fabricUrl || bulkGenerating || generating !== null} variant="outline" className="w-full h-11">
              {bulkGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Generate spec sheets — all sizes (S → 5XL)
            </Button>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground pt-2 block">Human model (optional)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button type="button" onClick={() => generate('model')} disabled={!fabricUrl || (!promptMode && !frontUrl) || generating !== null} variant="outline" className="h-11">
                {generating === 'model' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <User className="h-4 w-4 mr-2" />}
                Model (front)
              </Button>
              <Button type="button" onClick={() => generate('model-back')} disabled={!fabricUrl || (!promptMode && !frontUrl) || generating !== null} variant="outline" className="h-11">
                {generating === 'model-back' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <User className="h-4 w-4 mr-2" />}
                Model (back)
              </Button>
              <Button type="button" onClick={() => generate('lifestyle')} disabled={!fabricUrl || (!promptMode && !frontUrl) || generating !== null} className="h-11">
                {generating === 'lifestyle' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Lifestyle pose
              </Button>
            </div>

            <Label className="text-xs uppercase tracking-wider text-muted-foreground pt-2 block">Mannequin & 360°</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button type="button" onClick={() => generate('mannequin')} disabled={!fabricUrl || (!promptMode && !frontUrl) || generating !== null} variant="outline" className="h-11">
                {generating === 'mannequin' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shirt className="h-4 w-4 mr-2" />}
                Mannequin
              </Button>
              <Button type="button" onClick={() => generate('rotation-360')} disabled={!fabricUrl || (!promptMode && !frontUrl) || generating !== null} variant="outline" className="h-11">
                {generating === 'rotation-360' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                360° rotation
              </Button>
            </div>

            {/* Manual prompt export — no Gemini quota used */}
            <div className="pt-2 space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Manual — no API needed</Label>
              <Button type="button" onClick={exportPrompts} disabled={!fabricUrl || exportingPrompts} variant="outline" className="w-full h-11">
                {exportingPrompts ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ClipboardCopy className="h-4 w-4 mr-2" />}
                Export prompts (paste into Gemini app)
              </Button>
              <p className="text-xs text-muted-foreground">Copy each ready-made prompt + the fabric image into the Gemini app (or any AI image tool). Uses zero API quota.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt export dialog */}
      <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ready-to-paste prompts</DialogTitle>
            <DialogDescription>
              Open the Gemini app, attach the fabric image (and the Front mockup for other views), then paste a prompt below. No API quota used.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {fabricUrl && (
              <div className="flex items-center gap-3 rounded-md border bg-secondary/40 p-2">
                <img src={fabricUrl} alt="Fabric" className="h-14 w-14 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Fabric image</p>
                  <p className="text-[10px] text-muted-foreground truncate">{fabricUrl}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyText(fabricUrl)}><Copy className="h-3.5 w-3.5 mr-1" />Copy URL</Button>
                <Button size="sm" variant="outline" onClick={() => downloadOne(fabricUrl, 'fabric.png')}><Download className="h-3.5 w-3.5" /></Button>
              </div>
            )}
            {promptExports.length === 0 && <p className="text-sm text-muted-foreground">No prompts generated.</p>}
            {promptExports.map((p) => (
              <div key={p.view} className="space-y-1.5 rounded-md border p-3 bg-card">
                <div className="flex items-center justify-between">
                  <Badge>{p.label}</Badge>
                  <Button size="sm" variant="outline" onClick={() => copyText(p.prompt)}><Copy className="h-3.5 w-3.5 mr-1" />Copy prompt</Button>
                </div>
                <Textarea readOnly value={p.prompt} className="text-xs font-mono min-h-[120px] max-h-[200px]" />
              </div>
            ))}
            {promptExports.length > 0 && (
              <Button type="button" variant="secondary" className="w-full" onClick={() => copyText(promptExports.map(p => `=== ${p.label} ===\n${p.prompt}`).join('\n\n'))}>
                <Copy className="h-4 w-4 mr-2" /> Copy ALL prompts
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>


      {/* Bulk spec sheets results */}
      {bulkSpec.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Spec sheets — all sizes ({bulkSpec.length}/{BULK_SPEC_SIZES.length})</Label>
              <Button type="button" size="sm" variant="outline" onClick={async () => {
                const stamp = Date.now();
                for (const it of bulkSpec) await downloadOne(it.url, `muffigout-spec-${it.size}-${stamp}.png`);
              }}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download all sizes
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {bulkSpec.map(it => (
                <div key={it.size} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge>{it.size}</Badge>
                    <button onClick={() => downloadOne(it.url, `muffigout-spec-${it.size}.png`)} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                  <img src={it.url} alt={`Spec ${it.size}`} className="w-full h-auto max-h-[60vh] object-contain rounded-md bg-white border" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {(frontUrl || backUrl || specUrl || highlightsUrl || modelUrl || modelBackUrl || lifestyleUrl || mannequinUrl || rotation360Url) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { url: frontUrl, label: 'Front (with collar tag)', key: 'front' },
                { url: backUrl, label: 'Back', key: 'back' },
                { url: specUrl, label: 'Spec Sheet', key: 'spec' },
                { url: highlightsUrl, label: 'Key Highlights', key: 'highlights' },
                { url: modelUrl, label: 'Model — front', key: 'model' },
                { url: modelBackUrl, label: 'Model — back', key: 'model-back' },
                { url: lifestyleUrl, label: `Lifestyle — ${pose}`, key: 'lifestyle' },
                { url: mannequinUrl, label: 'Mannequin', key: 'mannequin' },
                { url: rotation360Url, label: '360° rotation', key: 'rotation-360' },
              ].map((v) => v.url ? (
                <div key={v.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{v.label}</Badge>
                    <div className="flex items-center gap-2">
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                        Open
                      </a>
                      <button onClick={() => downloadOne(v.url, `muffigout-shirt-${v.key}.png`)} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                        <Download className="h-3 w-3" /> Download
                      </button>
                    </div>
                  </div>
                  {v.key === 'rotation-360' ? (
                    <Spin360Viewer gridUrl={v.url} />
                  ) : (
                    <img
                      src={v.url}
                      alt={v.label}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.retried) {
                          img.dataset.retried = '1';
                          img.src = `${v.url}${v.url.includes('?') ? '&' : '?'}r=${Date.now()}`;
                        }
                      }}
                      className="w-full h-auto max-h-[80vh] object-contain rounded-md bg-white border"
                    />
                  )}
                </div>
              ) : null)}
            </div>

            <Button type="button" variant="outline" onClick={downloadAll} className="w-full h-11">
              <Download className="h-4 w-4 mr-2" /> Download all generated views
            </Button>

            {/* Info moved to bottom */}
            <div className="flex items-start gap-2 rounded-md bg-secondary/40 p-3 text-sm">
              <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">About these mockups</p>
                <p className="text-xs text-muted-foreground">
                  Men's full-sleeve button-down shirt rendered from your fabric swatch.
                  Color locked to <span className="font-mono text-foreground">{colorHex || 'auto-sampled'}</span>,
                  pattern reproduced from the fabric, MUFFI GOUT collar tag at the back-neck and a tonal MG monogram embroidered on the chest pocket.
                  Sized for <span className="font-medium text-foreground">{specs.size}</span> — Chest {specs.chest}″, Length {specs.length}″, Sleeve {specs.sleeve}″, Shoulder {specs.shoulder}″ ({specs.fabric}).
                  {hd ? ' Generated in HD (4K studio quality).' : ' Standard quality — toggle HD above for sharper output.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {productId && (frontUrl || backUrl || specUrl || highlightsUrl || modelUrl || modelBackUrl || lifestyleUrl || mannequinUrl || rotation360Url) && (
        <Button type="button" onClick={saveToProduct} className="w-full h-12">
          <ImageIcon className="h-4 w-4 mr-2" /> Save to this product's images
        </Button>
      )}
    </div>
  );
}
