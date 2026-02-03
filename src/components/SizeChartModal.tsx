import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SizeChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: 'men' | 'women' | 'kids';
}

const SizeChartModal = ({ open, onOpenChange, category = 'women' }: SizeChartModalProps) => {
  const womenSizes = [
    { size: 'XS', chest: '32-33', waist: '24-25', hip: '34-35', inchChest: '81-84', inchWaist: '61-64', inchHip: '86-89' },
    { size: 'S', chest: '34-35', waist: '26-27', hip: '36-37', inchChest: '86-89', inchWaist: '66-69', inchHip: '91-94' },
    { size: 'M', chest: '36-37', waist: '28-29', hip: '38-39', inchChest: '91-94', inchWaist: '71-74', inchHip: '97-99' },
    { size: 'L', chest: '38-40', waist: '30-32', hip: '40-42', inchChest: '97-102', inchWaist: '76-81', inchHip: '102-107' },
    { size: 'XL', chest: '41-43', waist: '33-35', hip: '43-45', inchChest: '104-109', inchWaist: '84-89', inchHip: '109-114' },
  ];

  const menSizes = [
    { size: 'S', chest: '36-38', waist: '30-32', hip: '36-38', inchChest: '91-97', inchWaist: '76-81', inchHip: '91-97' },
    { size: 'M', chest: '38-40', waist: '32-34', hip: '38-40', inchChest: '97-102', inchWaist: '81-86', inchHip: '97-102' },
    { size: 'L', chest: '40-42', waist: '34-36', hip: '40-42', inchChest: '102-107', inchWaist: '86-91', inchHip: '102-107' },
    { size: 'XL', chest: '42-44', waist: '36-38', hip: '42-44', inchChest: '107-112', inchWaist: '91-97', inchHip: '107-112' },
    { size: 'XXL', chest: '44-46', waist: '38-40', hip: '44-46', inchChest: '112-117', inchWaist: '97-102', inchHip: '112-117' },
  ];

  const kidsSizes = [
    { size: '2-3Y', height: '92-98', chest: '21', waist: '20' },
    { size: '4-5Y', height: '104-110', chest: '22', waist: '21' },
    { size: '6-7Y', height: '116-122', chest: '24', waist: '22' },
    { size: '8-9Y', height: '128-134', chest: '26', waist: '23' },
    { size: '10-11Y', height: '140-146', chest: '28', waist: '24' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Size Guide</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={category} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="women">Women</TabsTrigger>
            <TabsTrigger value="men">Men</TabsTrigger>
            <TabsTrigger value="kids">Kids</TabsTrigger>
          </TabsList>

          <TabsContent value="women" className="mt-6">
            <Tabs defaultValue="inches">
              <TabsList className="mb-4">
                <TabsTrigger value="inches">Inches</TabsTrigger>
                <TabsTrigger value="cm">Centimeters</TabsTrigger>
              </TabsList>

              <TabsContent value="inches">
                <div className="overflow-x-auto">
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
                      {womenSizes.map((row) => (
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
              </TabsContent>

              <TabsContent value="cm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="border border-border px-4 py-3 text-left">Size</th>
                        <th className="border border-border px-4 py-3 text-left">Chest (cm)</th>
                        <th className="border border-border px-4 py-3 text-left">Waist (cm)</th>
                        <th className="border border-border px-4 py-3 text-left">Hip (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {womenSizes.map((row) => (
                        <tr key={row.size} className="hover:bg-secondary/50">
                          <td className="border border-border px-4 py-3 font-medium">{row.size}</td>
                          <td className="border border-border px-4 py-3">{row.inchChest}</td>
                          <td className="border border-border px-4 py-3">{row.inchWaist}</td>
                          <td className="border border-border px-4 py-3">{row.inchHip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="men" className="mt-6">
            <div className="overflow-x-auto">
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
          </TabsContent>

          <TabsContent value="kids" className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-secondary">
                    <th className="border border-border px-4 py-3 text-left">Age</th>
                    <th className="border border-border px-4 py-3 text-left">Height (cm)</th>
                    <th className="border border-border px-4 py-3 text-left">Chest (in)</th>
                    <th className="border border-border px-4 py-3 text-left">Waist (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {kidsSizes.map((row) => (
                    <tr key={row.size} className="hover:bg-secondary/50">
                      <td className="border border-border px-4 py-3 font-medium">{row.size}</td>
                      <td className="border border-border px-4 py-3">{row.height}</td>
                      <td className="border border-border px-4 py-3">{row.chest}</td>
                      <td className="border border-border px-4 py-3">{row.waist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

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
