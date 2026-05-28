import { useRef, useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

interface Product360ViewerProps {
  frames: string[];
  className?: string;
}

/**
 * Manual 360° viewer — user drags left/right (or swipes on touch) to rotate.
 * No autoplay. Frames are preloaded for smooth scrubbing.
 */
const Product360Viewer = ({ frames, className = '' }: Product360ViewerProps) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [hintShown, setHintShown] = useState(true);
  const dragState = useRef<{ startX: number; startIdx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload frames
  useEffect(() => {
    let cancelled = false;
    setLoaded(0);
    frames.forEach((src) => {
      const img = new Image();
      img.onload = () => { if (!cancelled) setLoaded((n) => n + 1); };
      img.onerror = () => { if (!cancelled) setLoaded((n) => n + 1); };
      img.src = src;
    });
    return () => { cancelled = true; };
  }, [frames]);

  const handleDown = (clientX: number) => {
    dragState.current = { startX: clientX, startIdx: frameIndex };
    setHintShown(false);
  };

  const handleMove = (clientX: number) => {
    if (!dragState.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const delta = clientX - dragState.current.startX;
    // One full rotation per drag across container width
    const framesPerPixel = frames.length / width;
    const newIdx = Math.round(dragState.current.startIdx + delta * framesPerPixel);
    const wrapped = ((newIdx % frames.length) + frames.length) % frames.length;
    setFrameIndex(wrapped);
  };

  const handleUp = () => { dragState.current = null; };

  if (!frames || frames.length === 0) return null;

  const allLoaded = loaded >= frames.length;

  return (
    <div className={`relative w-full aspect-square bg-secondary/30 rounded-2xl overflow-hidden select-none ${className}`}>
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-ew-resize touch-none"
        onMouseDown={(e) => handleDown(e.clientX)}
        onMouseMove={(e) => dragState.current && handleMove(e.clientX)}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={(e) => handleDown(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleUp}
      >
        <img
          src={frames[frameIndex]}
          alt={`360° view frame ${frameIndex + 1}`}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {!allLoaded && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Loading 360° view… {loaded}/{frames.length}</div>
        </div>
      )}

      {allLoaded && hintShown && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none animate-pulse">
          <RotateCw className="h-3 w-3" />
          Drag to rotate
        </div>
      )}

      <div className="absolute top-3 right-3 bg-foreground/70 text-background text-[10px] px-2 py-0.5 rounded-full font-medium">
        360°
      </div>
    </div>
  );
};

export default Product360Viewer;
