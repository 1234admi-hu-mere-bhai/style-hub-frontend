import { Phone, MessageCircle, Package, RefreshCw, Clock, Shield, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ReturnExchange = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-primary/5 py-12 lg:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">Return & Exchange Policy</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We want you to love what you buy. If something isn't right, here's how we make it better.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 lg:py-16 max-w-4xl space-y-10">

        {/* Key Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, title: '7-Day Returns', desc: 'From the date of delivery' },
            { icon: RefreshCw, title: 'Exchanges Available', desc: 'Size & color exchanges' },
            { icon: Shield, title: 'Refund to Source', desc: 'Original payment method' },
          ].map((item, i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Return Policy */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">Return Policy</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>We accept returns within <strong className="text-foreground">7 days from the date of delivery</strong>. To be eligible for a return, the item must be:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Unused, unwashed, and in its original condition</li>
              <li>With all original tags and packaging intact</li>
              <li>Free from any alterations or damage</li>
            </ul>
          </div>
        </section>

        {/* How to Return */}
        <section className="bg-secondary/30 rounded-xl p-6 lg:p-8">
          <h2 className="font-serif text-2xl font-bold mb-4">How to Initiate a Return</h2>
          <p className="text-muted-foreground mb-6">
            Returns are processed manually. Follow these steps to request a return:
          </p>
          <ol className="space-y-4">
            {[
              { step: '1', title: 'Contact Us', desc: 'Call or WhatsApp us at the number below within 7 days of delivery.' },
              { step: '2', title: 'Share Proof', desc: 'Send photos/videos of the product along with your order number and the reason for return.' },
              { step: '3', title: 'Verification', desc: 'Our team will review your request and verify the proof within 24–48 hours.' },
              { step: '4', title: 'Return Approved', desc: 'Once approved, we will arrange pickup or guide you on how to send the item back.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Contact Card */}
          <div className="mt-6 p-4 bg-background rounded-lg border border-border flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">WhatsApp / Call</h4>
              <a href="tel:+919136354192" className="text-primary font-medium text-lg hover:underline">
                +91 91363 54192
              </a>
              <p className="text-xs text-muted-foreground mt-0.5">Available Mon–Sat, 10 AM – 7 PM</p>
            </div>
          </div>
        </section>

        {/* Exchange Policy */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">Exchange Policy</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>We offer exchanges for <strong className="text-foreground">size and color</strong>, subject to availability. To request an exchange:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Contact us within 7 days of delivery via call or WhatsApp</li>
              <li>Share your order number and the preferred size/color</li>
              <li>The item must be in unused, original condition with tags intact</li>
              <li>Exchanges are subject to stock availability</li>
            </ul>
          </div>
        </section>

        {/* Refund Details */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">Refund Details</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>Once your return is received and inspected, we will notify you of the approval.</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Refunds are credited to the <strong className="text-foreground">original payment method</strong></li>
              <li>Processing time: <strong className="text-foreground">7 business days</strong> after approval</li>
              <li>Shipping charges are non-refundable</li>
            </ul>
          </div>
        </section>

        {/* Non-returnable */}
        <section className="border border-destructive/30 bg-destructive/5 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Non-Returnable Items</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Innerwear and undergarments</li>
                <li>Items purchased on clearance/final sale</li>
                <li>Altered or customized products</li>
                <li>Items without original tags or packaging</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger>Can I return a product if I changed my mind?</AccordionTrigger>
              <AccordionContent>
                Yes, as long as the product is unused with original tags intact and you contact us within 7 days of delivery with valid proof.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>What proof do I need to share for a return?</AccordionTrigger>
              <AccordionContent>
                Please share clear photos or a video of the product, your order number, and the reason for return via WhatsApp at +91 91363 54192.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>How long does it take to get a refund?</AccordionTrigger>
              <AccordionContent>
                Refunds are processed within 7 business days after the return is approved. The amount will be credited to your original payment method.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>Can I exchange for a different product?</AccordionTrigger>
              <AccordionContent>
                Exchanges are available for size or color of the same product only, subject to stock availability. For a different product, you may return and place a new order.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger>Who bears the return shipping cost?</AccordionTrigger>
              <AccordionContent>
                If the return is due to a defective or wrong product, we will cover the shipping. For other reasons, the customer bears the return shipping cost.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default ReturnExchange;
