import { Ruler, MessageCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const shirtSizes = [
  { size: 'S', chest: '36-38', waist: '30-32', shoulder: '16.5', length: '27', chestCm: '91-97', waistCm: '76-81', shoulderCm: '42', lengthCm: '69' },
  { size: 'M', chest: '38-40', waist: '32-34', shoulder: '17.5', length: '28', chestCm: '97-102', waistCm: '81-86', shoulderCm: '44.5', lengthCm: '71' },
  { size: 'L', chest: '40-42', waist: '34-36', shoulder: '18.5', length: '29', chestCm: '102-107', waistCm: '86-91', shoulderCm: '47', lengthCm: '74' },
  { size: 'XL', chest: '42-44', waist: '36-38', shoulder: '19.5', length: '30', chestCm: '107-112', waistCm: '91-97', shoulderCm: '49.5', lengthCm: '76' },
  { size: 'XXL', chest: '44-46', waist: '38-40', shoulder: '20.5', length: '31', chestCm: '112-117', waistCm: '97-102', shoulderCm: '52', lengthCm: '79' },
];

const fitTypes = [
  {
    name: 'Slim Fit',
    description: 'Tailored close to the body for a modern, sharp look. Best for lean body types.',
    tip: 'If you prefer a little room, consider sizing up.',
  },
  {
    name: 'Regular Fit',
    description: 'Classic comfortable fit that sits well on most body types. Not too tight, not too loose.',
    tip: 'True to size — go with your usual size.',
  },
  {
    name: 'Oversized / Relaxed Fit',
    description: 'Loose, streetwear-inspired fit with extra room in the chest and shoulders.',
    tip: 'These already run large — stick to your regular size for the intended oversized look.',
  },
];

const measurementSteps = [
  {
    title: 'Chest',
    instruction: 'Wrap the tape around the fullest part of your chest, under the armpits, keeping it level across the back.',
  },
  {
    title: 'Waist',
    instruction: 'Measure around your natural waistline — the narrowest part of your torso, usually just above the navel.',
  },
  {
    title: 'Shoulder',
    instruction: 'Measure from the edge of one shoulder to the other, across the back, following the seam line.',
  },
  {
    title: 'Length',
    instruction: 'Measure from the highest point of the shoulder, down the front to the desired hemline.',
  },
];

const SizeGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-primary/5 py-12 lg:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Ruler className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">Men's Size Guide</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find your perfect fit with our detailed size chart and measuring guide.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 lg:py-16 max-w-4xl space-y-12">

        {/* How to Measure */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6">How to Measure</h2>
          <p className="text-muted-foreground mb-6">
            Use a soft measuring tape. Wear light clothing and stand straight for accurate measurements.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {measurementSteps.map((step, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.instruction}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Shirt Size Chart */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6">Shirt Size Chart</h2>
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
                      <th className="border border-border px-4 py-3 text-left">Shoulder (in)</th>
                      <th className="border border-border px-4 py-3 text-left">Length (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shirtSizes.map((row) => (
                      <tr key={row.size} className="hover:bg-secondary/50">
                        <td className="border border-border px-4 py-3 font-medium">{row.size}</td>
                        <td className="border border-border px-4 py-3">{row.chest}</td>
                        <td className="border border-border px-4 py-3">{row.waist}</td>
                        <td className="border border-border px-4 py-3">{row.shoulder}</td>
                        <td className="border border-border px-4 py-3">{row.length}</td>
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
                      <th className="border border-border px-4 py-3 text-left">Shoulder (cm)</th>
                      <th className="border border-border px-4 py-3 text-left">Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shirtSizes.map((row) => (
                      <tr key={row.size} className="hover:bg-secondary/50">
                        <td className="border border-border px-4 py-3 font-medium">{row.size}</td>
                        <td className="border border-border px-4 py-3">{row.chestCm}</td>
                        <td className="border border-border px-4 py-3">{row.waistCm}</td>
                        <td className="border border-border px-4 py-3">{row.shoulderCm}</td>
                        <td className="border border-border px-4 py-3">{row.lengthCm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Fit Guide */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6">Fit Guide</h2>
          <p className="text-muted-foreground mb-6">
            Our shirts come in different fits. Understanding the fit type helps you pick the right size.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fitTypes.map((fit, i) => (
              <Card key={i} className="h-full">
                <CardContent className="pt-6 flex flex-col h-full">
                  <h3 className="font-semibold text-lg mb-2">{fit.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{fit.description}</p>
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-xs font-medium text-primary">💡 {fit.tip}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="bg-secondary/30 rounded-xl p-6 lg:p-8">
          <h2 className="font-serif text-2xl font-bold mb-4">Tips for the Best Fit</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              If you're between two sizes, we recommend going with the larger size for comfort.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Compare your measurements with the size chart rather than relying on your usual size — sizing may vary between brands.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              For a relaxed look, size up by one. For a fitted look, go true to size.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Keep in mind that fabrics may shrink slightly after the first wash — check the care label.
            </li>
          </ul>
        </section>

        {/* Need Help */}
        <div className="text-center bg-primary/5 rounded-xl p-8">
          <h3 className="font-serif text-xl font-bold mb-2">Still unsure about your size?</h3>
          <p className="text-muted-foreground mb-4">
            Send us your measurements and we'll recommend the perfect size for you.
          </p>
          <a
            href="https://wa.me/919136354192?text=Hi%2C%20I%20need%20help%20finding%20my%20size"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Get Size Help on WhatsApp
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SizeGuide;
