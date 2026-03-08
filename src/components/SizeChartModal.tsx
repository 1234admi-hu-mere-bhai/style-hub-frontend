import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SizeChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: 'men';
}

const SizeChartModal = ({ open, onOpenChange }: SizeChartModalProps) => {
  const menSizes = [
    { size: 'S', chest: '36-38', waist: '30-32', hip: '36-38', inchChest: '91-97', inchWaist: '76-81', inchHip: '91-97' },
    { size: 'M', chest: '38-40', waist: '32-34', hip: '38-40', inchChest: '97-102', inchWaist: '81-86', inchHip: '97-102' },
    { size: 'L', chest: '40-42', waist: '34-36', hip: '40-42', inchChest: '102-107', inchWaist: '86-91', inchHip: '102-107' },
    { size: 'XL', chest: '42-44', waist: '36-38', hip: '42-44', inchChest: '107-112', inchWaist: '91-97', inchHip: '107-112' },
    { size: 'XXL', chest: '44-46', waist: '38-40', hip: '44-46', inchChest: '112-117', inchWaist: '97-102', inchHip: '112-117' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Men's Size Guide</DialogTitle>
        </DialogHeader>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary">
                <th className="border border-border px-4 py-3 text-left">Size</th>
                <th className="border border-border px-4 py-3 text-left">Chest (in)</th>
                <th className="border border-border px-4 py-3 text-left">Waist (in)</th>
                <th className="border border-border px-4 py-3 text-left">Hip (in)</th>
              </tr>
            </thead>
            <tbody>
              {menSizes.map((row) => (
                <tr key={row.size} className="hover:bg-secondary/50">
                  <td className="border border-border px-4 py-3 font-medium">{row.size}</td>
                  <td className="border border-border px-4 py-3">{row.chest}</td>
                  <td className="border border-border px-4 py-3">{row.waist}</td>
                  <td className="border border-border px-4 py-3">{row.hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
          <h4 className="font-semibold mb-2">How to Measure</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><strong>Chest:</strong> Measure around the fullest part of your chest</li>
            <li><strong>Waist:</strong> Measure around your natural waistline</li>
            <li><strong>Hip:</strong> Measure around the fullest part of your hips</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SizeChartModal;
