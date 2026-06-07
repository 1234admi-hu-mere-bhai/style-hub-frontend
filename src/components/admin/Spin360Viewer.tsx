import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCw } from 'lucide-react';

interface Props {
  /** URL of a 4x2 grid image containing 8 sequential rotation frames (left-to-right, top-to-bottom). */
  gridUrl: string;
  cols?: number;
  rows?: number;
  className?: string;
}

/**
 * Interactive 360° spinner. Slices a 4x2 grid mockup into 8 frames client-side
 * and lets the user drag horizontally (or swipe on touch) to rotate the garment.
 */
export default function Spin360Viewer({ gridUrl, cols = 4, rows = 2, className }: Props) {
  const total = cols * rows;
  const [frames, setFrames] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoSpin, setAutoSpin] = useState(false);
  const dragRef = useRef<{ x: number; idx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Slice grid into individual frames
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFrames([]);
    setIdx(0);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const fw = Math.floor(img.naturalWidth / cols);
        const fh = Math.floor(img.naturalHeight / rows);
        const out: string[] = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const canvas = document.createElement('canvas');
            canvas.width = fw;
            canvas.height = fh;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            ctx.drawImage(img, c * fw, r * fh, fw, fh, 0, 0, fw, fh);
            out.push(canvas.toDataURL('image/png'));
          }
        }
        if (!cancelled) {
          setFrames(out);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to slice frames');
          setLoading(false);
        }
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setError('Could not load 360° grid image (CORS or network).');
        setLoading(false);
      }
    };
    img.src = gridUrl;
    return () => { cancelled = true; };
  }, [gridUrl, cols, rows]);

  // Auto-spin
  useEffect(() => {
    if (!autoSpin || frames.length === 0) return;
    const id = window.setInterval(() => setIdx(i => (i + 1) % frames.length), 120);
    return () => window.clearInterval(id);
  }, [autoSpin, frames.length]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (frames.length === 0) return;
    setAutoSpin(false);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, idx };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || frames.length === 0) return;
    const width = containerRef.current?.clientWidth || 300;
    const dx = e.clientX - dragRef.current.x;
    // Full container drag = one full rotation
    const step = width / frames.length;
    const delta = Math.round(dx / step);
    const next = ((dragRef.current.idx + delta) % frames.length + frames.length) % frames.length;
    setIdx(next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className={className}>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative w-full aspect-square rounded-md bg-white border overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing 360°…
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-destructive text-xs p-4 text-center">
            {error}
          </div>
        )}
        {!loading && !error && frames[idx] && (
          <img
            src={frames[idx]}
            alt={`Frame ${idx + 1} of ${frames.length}`}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none"
          />
        )}
        {!loading && !error && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
            Drag to spin · {Math.round((idx / Math.max(1, frames.length)) * 360)}°
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 gap-2">
        <button
          type="button"
          onClick={() => setAutoSpin(s => !s)}
          disabled={loading || !!error}
          className="text-xs text-primary inline-flex items-center gap-1 hover:underline disabled:opacity-50"
        >
          <RotateCw className={`h-3 w-3 ${autoSpin ? 'animate-spin' : ''}`} />
          {autoSpin ? 'Stop auto-spin' : 'Auto-spin'}
        </button>
        <span className="text-[10px] text-muted-foreground">{frames.length} frames · drag left/right</span>
      </div>
    </div>
  );
}
