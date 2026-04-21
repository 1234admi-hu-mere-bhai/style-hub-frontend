import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  invoiceUrl: string | null;
  onGenerated?: (invoiceUrl: string) => void;
}

const decodeInvoice = (url: string | null): string | null => {
  if (!url) return null;
  // Stored as data:text/plain;base64,<content>
  if (url.startsWith('data:text/plain;base64,')) {
    try {
      return atob(url.split(',')[1] || '');
    } catch {
      return null;
    }
  }
  // External URL fallback
  return null;
};

const InvoiceDialog = ({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  invoiceUrl,
  onGenerated,
}: InvoiceDialogProps) => {
  const [content, setContent] = useState<string | null>(decodeInvoice(invoiceUrl));
  const [externalUrl, setExternalUrl] = useState<string | null>(
    invoiceUrl && !invoiceUrl.startsWith('data:') ? invoiceUrl : null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setContent(decodeInvoice(invoiceUrl));
    setExternalUrl(invoiceUrl && !invoiceUrl.startsWith('data:') ? invoiceUrl : null);
  }, [invoiceUrl]);

  const generateNow = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const text = (data as any)?.invoice as string | undefined;
      if (text) {
        setContent(text);
        const newUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
        onGenerated?.(newUrl);
        toast.success('Invoice generated');
      } else {
        toast.error('Could not generate invoice');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate if no invoice exists when dialog opens
  useEffect(() => {
    if (open && !content && !externalUrl && !isGenerating) {
      generateNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!content) return;
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) {
      toast.error('Please allow pop-ups to print the invoice');
      return;
    }
    w.document.write(`
      <html>
        <head>
          <title>Invoice ${orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 32px; white-space: pre-wrap; line-height: 1.5; color: #111; }
            h1 { font-family: sans-serif; font-size: 18px; border-bottom: 2px solid #111; padding-bottom: 8px; }
          </style>
        </head>
        <body>
          <h1>MUFFIGOUT APPAREL HUB — Invoice ${orderNumber}</h1>
          <pre>${content.replace(/</g, '&lt;')}</pre>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Invoice — {orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 bg-secondary/20">
          {externalUrl ? (
            <iframe
              src={externalUrl}
              title="Invoice"
              className="w-full h-[60vh] rounded-md border border-border bg-card"
            />
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your invoice...</p>
            </div>
          ) : content ? (
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground bg-card border border-border rounded-md p-5">
              {content}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Invoice not available yet.</p>
              <Button onClick={generateNow} size="sm" className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-card flex flex-row gap-2 sm:justify-end">
          {content && !externalUrl && (
            <>
              <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-full">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button size="sm" onClick={handleDownload} className="rounded-full">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}
          {externalUrl && (
            <Button asChild size="sm" className="rounded-full">
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Open Invoice
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;
