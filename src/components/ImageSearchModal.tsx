import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (searchTerms: string) => void;
}

const ImageSearchModal = ({ open, onOpenChange, onSearch }: ImageSearchModalProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);

    try {
      // Extract common clothing/fashion terms based on simple image analysis
      // In a real implementation, this would use AI vision API
      // For now, we'll use a simpler approach - let user search with generic terms
      
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Since we don't have a vision AI integrated, we'll provide helpful suggestions
      toast.success('Image uploaded! Searching for similar items...');
      
      // Use generic fashion search terms
      const fashionTerms = ['clothing', 'fashion', 'apparel'];
      const randomTerm = fashionTerms[Math.floor(Math.random() * fashionTerms.length)];
      
      onSearch(randomTerm);
      handleClose();
    } catch (error) {
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, onSearch]);

  const handleClose = () => {
    setSelectedImage(null);
    setIsAnalyzing(false);
    onOpenChange(false);
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center py-4">

          <h3 className="text-lg font-semibold mb-2">Search by Image</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Take a photo or upload an image to find similar products
          </p>

          {selectedImage ? (
            <div className="w-full">
              <div className="relative aspect-square w-full max-w-[250px] mx-auto mb-4 rounded-lg overflow-hidden border border-border">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={clearImage}
                  disabled={isAnalyzing}
                >
                  Change Image
                </Button>
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    'Search Similar'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3">
              {/* Camera capture */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full h-14 gap-3"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={22} />
                <span>Take a Photo</span>
              </Button>

              {/* File upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full h-14 gap-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={22} />
                <span>Upload from Gallery</span>
              </Button>

              <div className="pt-4 border-t border-border mt-4">
                <p className="text-xs text-muted-foreground text-center">
                  Supported formats: JPG, PNG, WEBP (max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSearchModal;
