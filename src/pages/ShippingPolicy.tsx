import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Truck, Clock, MapPin, Package, AlertCircle, IndianRupee } from 'lucide-react';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
        <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-2">Shipping Policy</h1>
        <p className="text-muted-foreground mb-10">Everything you need to know about our delivery process</p>

        <div className="space-y-10 text-foreground/90 leading-relaxed">
          {/* Shipping Charges */}
          <section className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-xl font-semibold">Shipping Charges</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-4 border">
                <p className="font-semibold text-lg text-primary">FREE</p>
                <p className="text-muted-foreground text-sm">On orders above ₹999</p>
              </div>
              <div className="bg-background rounded-lg p-4 border">
                <p className="font-semibold text-lg">₹99</p>
                <p className="text-muted-foreground text-sm">Standard shipping for orders below ₹999</p>
              </div>
            </div>
          </section>

          {/* Delivery Timelines */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-xl font-semibold">Delivery Timelines</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-lg overflow-hidden">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Region</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Estimated Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-sm">West Bengal (Local)</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">3–5 business days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">Metro Cities (Delhi, Mumbai, Bangalore, etc.)</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">7–10 business days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">Rest of India</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">10–15 business days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">Remote / Rural Areas</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">15–20 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Delivery times are estimates and may vary due to weather, holidays, or carrier delays.
            </p>
          </section>

          {/* Shipping Zones */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-xl font-semibold">Serviceable Areas</h2>
            </div>
            <p className="text-muted-foreground mb-3">
              We currently deliver across <strong className="text-foreground">all of India</strong> through our trusted courier partners.
              Enter your pincode at checkout to check delivery availability and estimated delivery date for your location.
            </p>
            <p className="text-muted-foreground">
              We do not offer international shipping at this time. Stay tuned for updates!
            </p>
          </section>

          {/* Order Processing */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-xl font-semibold">Order Processing</h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Orders are processed within <strong className="text-foreground">24–48 hours</strong> after payment confirmation.</li>
              <li>Orders placed on weekends or public holidays will be processed the next business day.</li>
              <li>You will receive a tracking ID via email/SMS once your order is shipped.</li>
              <li>Track your order anytime on our <a href="/track-order" className="text-primary underline">Track Order</a> page.</li>
            </ul>
          </section>

          {/* Shipping Partners */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-xl font-semibold">Our Shipping Partners</h2>
            </div>
            <p className="text-muted-foreground">
              We work with India's leading courier services including Delhivery, BlueDart, DTDC, and India Post to ensure 
              safe and timely delivery of your orders. The courier partner may vary based on your location and order details.
            </p>
          </section>

          {/* Important Notes */}
          <section className="bg-secondary/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-xl font-semibold">Important Notes</h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Please ensure your shipping address and phone number are correct to avoid delivery issues.</li>
              <li>All orders are prepaid via UPI, cards, or net banking.</li>
              <li>In case of failed delivery attempts, the order will be returned to our warehouse.</li>
              <li>For bulk orders or special delivery requests, contact us at <span className="text-foreground">support@muffi.com</span>.</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShippingPolicy;
