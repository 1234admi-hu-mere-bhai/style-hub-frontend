import { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { StoreProduct } from '@/hooks/useDbProducts';

interface Props {
  product: StoreProduct;
  selectedColor?: string;
}

const Row = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
};

const HighlightCell = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-semibold text-foreground">{value || '—'}</p>
  </div>
);

const ProductHighlights = ({ product, selectedColor }: Props) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const fabric = product.fabric || 'Cotton';
  const color = selectedColor || product.colorFamily || '—';
  const fit = product.fit || 'Regular';
  // Heuristic pattern fallback
  const pattern = (product as any).pattern || 'Solid';
  const sleeve = product.sleeveType || 'Long Sleeves';
  const neck = product.neckType || 'Spread Collar';
  const occasion = product.occasion || 'Casual';

  const handleCopy = async () => {
    const text = [
      `Fabric: ${fabric}`,
      `Color: ${color}`,
      `Pattern: ${pattern}`,
      `Fit/Shape: ${fit}`,
      `Sleeve: ${sleeve}`,
      `Neck: ${neck}`,
      `Occasion: ${occasion}`,
      `Country of Origin: India`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Highlights copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <section className="mt-12 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="font-serif text-xl md:text-2xl font-bold">Product Highlights</h2>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {/* 2x2 quick grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-5">
        <HighlightCell label="Fabric" value={fabric} />
        <HighlightCell label="Color" value={color} />
        <HighlightCell label="Pattern" value={pattern} />
        <HighlightCell label="Fit/Shape" value={fit} />
      </div>

      {/* Additional details (collapsible) */}
      <div className="border-t border-border">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors"
        >
          <span className="font-semibold">Additional Details</span>
          <ChevronDown
            size={20}
            className={`text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
        {expanded && (
          <div className="px-6 pb-5 animate-fade-in">
            <Row label="Sleeve Length" value={sleeve} />
            <Row label="Neck" value={neck} />
            <Row label="Occasion" value={occasion} />
            <Row label="Sleeve Styling" value="Regular" />
            <Row label="Weave Pattern" value="Regular" />
            <Row label="Length" value="Regular" />
            <Row label="Number of Pockets" value="1" />
            <Row label="Closure" value="Button" />
            <Row label="Stretchability" value="No" />
            <Row label="Generic Name" value={product.subcategory || 'Apparel'} />
            <Row label="Country of Origin" value="India" />
          </div>
        )}
      </div>

      {/* Long description footer */}
      {product.description && (
        <div className="px-6 py-5 border-t border-border bg-secondary/20">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}
    </section>
  );
};

export default ProductHighlights;
</content>
</invoke>