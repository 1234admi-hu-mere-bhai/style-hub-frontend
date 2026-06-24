import { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { StoreProduct } from '@/hooks/useDbProducts';

interface Props {
  product: StoreProduct;
  selectedColor?: string;
}

type Tab = 'specs' | 'description' | 'manufacturer';

const HighlightCell = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-semibold text-foreground">{value || '—'}</p>
  </div>
);

const SpecCell = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="py-3 border-b border-border/60">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
};

const ProductHighlights = ({ product, selectedColor }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('specs');
  const [copied, setCopied] = useState(false);

  const fabric = product.fabric || 'Cotton';
  const color = selectedColor || product.colorFamily || '—';
  const fit = product.fit || 'Regular';
  const pattern = (product as any).pattern || 'Solid';
  const sleeve = product.sleeveType || 'Long Sleeves';
  const neck = product.neckType || 'Spread Collar';
  const occasion = product.occasion || 'Casual';
  const brand = (product as any).brand || 'Muffigout';
  const styleCode = (product as any).styleCode || product.id?.toString().toUpperCase();
  const closure = (product as any).closure || 'Button';
  const pockets = (product as any).pockets || '1';
  const fabricCare = (product as any).fabricCare || 'Hand wash or machine wash';
  const salesPackage = (product as any).salesPackage || `1 ${product.subcategory || 'Apparel'}`;
  const netQuantity = (product as any).netQuantity || '1';
  const brandColor = (product as any).brandColor || color;
  const idealFor = (product as any).idealFor || 'Men';
  const size = (product as any).size || 'As selected';
  const usage = (product as any).usage || occasion;

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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'specs', label: 'Specifications' },
    { id: 'description', label: 'Description' },
    { id: 'manufacturer', label: 'Manufacturer info' },
  ];

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

      {/* All details (collapsible, Meesho-style) */}
      <div className="border-t border-border">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors"
        >
          <span className="font-semibold">All details</span>
          <ChevronDown
            size={20}
            className={`text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {expanded && (
          <div className="px-6 pb-5 animate-fade-in">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
              {tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      active
                        ? 'bg-foreground text-background'
                        : 'bg-secondary/60 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab === 'specs' && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">General</h3>
                <div className="grid grid-cols-2 gap-x-6">
                  <SpecCell label="Brand" value={brand} />
                  <SpecCell label="Style Code" value={styleCode} />
                  <SpecCell label="Closure" value={closure} />
                  <SpecCell label="Pockets" value={pockets} />
                  <SpecCell label="Fabric Care" value={fabricCare} />
                  <div />
                  <SpecCell label="Sales Package" value={salesPackage} />
                  <SpecCell label="Fabric" value={fabric} />
                  <SpecCell label="Pattern" value={pattern} />
                  <SpecCell label="Color" value={color} />
                  <SpecCell label="Net Quantity" value={netQuantity} />
                  <SpecCell label="Brand Color" value={brandColor} />
                  <SpecCell label="Ideal For" value={idealFor} />
                  <SpecCell label="Size" value={size} />
                  <SpecCell label="Usage" value={usage} />
                  <SpecCell label="Sleeve" value={sleeve} />
                  <SpecCell label="Neck" value={neck} />
                  <SpecCell label="Occasion" value={occasion} />
                  <SpecCell label="Country of Origin" value="India" />
                </div>
              </div>
            )}

            {tab === 'description' && (
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {product.description || 'No description available for this product.'}
              </div>
            )}

            {tab === 'manufacturer' && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Manufactured by</p>
                  <p className="font-medium text-foreground">{brand}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marketed by</p>
                  <p className="font-medium text-foreground">Muffigout Apparel Hub</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Country of Origin</p>
                  <p className="font-medium text-foreground">India</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer Care</p>
                  <p className="font-medium text-foreground">support@muffigoutapparelhub.com</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductHighlights;
