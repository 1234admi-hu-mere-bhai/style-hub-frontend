import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageZoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
}

const ImageZoomDialog = ({ open, onOpenChange, src, alt }: ImageZoomDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen w-screen h-screen sm:max-w-screen p-0 border-0 bg-background/95 backdrop-blur-sm">
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={5}
          doubleClick={{ mode: 'toggle', step: 2 }}
          wheel={{ step: 0.2 }}
          pinch={{ step: 5 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute top-3 right-3 z-50 flex gap-2">
                <button onClick={() => zoomIn()} aria-label="Zoom in" className="w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center">
                  <ZoomIn size={18} />
                </button>
                <button onClick={() => zoomOut()} aria-label="Zoom out" className="w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center">
                  <ZoomOut size={18} />
                </button>
                <button onClick={() => resetTransform()} aria-label="Reset zoom" className="w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center">
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => onOpenChange(false)} aria-label="Close" className="w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>
              <TransformComponent
                wrapperClass="!w-screen !h-screen"
                contentClass="!w-screen !h-screen flex items-center justify-center"
              >
                <img
                  src={src}
                  alt={alt || 'Product image'}
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                />
              </TransformComponent>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-card/80 px-3 py-1 rounded-full pointer-events-none">
                Pinch, double-tap or scroll to zoom
              </div>
            </>
          )}
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
};

export default ImageZoomDialog;
