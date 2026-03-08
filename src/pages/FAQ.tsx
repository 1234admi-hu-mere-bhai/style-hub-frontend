import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqSections = [
  {
    title: 'Orders & Shipping',
    faqs: [
      {
        q: 'How long does delivery take?',
        a: 'Delivery takes up to 15 days depending on your location. Metro cities typically receive orders faster than remote areas.',
      },
      {
        q: 'What are the shipping charges?',
        a: 'Shipping is FREE on orders above ₹999. For orders below ₹999, a standard shipping fee will be applied at checkout.',
      },
      {
        q: 'Is Cash on Delivery (COD) available?',
        a: 'No, we currently do not offer Cash on Delivery. All orders must be prepaid via UPI, debit/credit card, or net banking.',
      },
      {
        q: 'How can I track my order?',
        a: 'Once your order is shipped, you will receive a tracking link via email/SMS. You can also track your order from the "Track Order" page on our website.',
      },
      {
        q: 'Can I cancel my order after placing it?',
        a: 'You can request a cancellation by contacting us on WhatsApp at +91 91363 54192 before the order is shipped. Once shipped, cancellations are not possible — you may initiate a return instead.',
      },
      {
        q: 'Do you deliver across India?',
        a: 'Yes, we deliver all across India. Delivery time varies based on your pincode and location.',
      },
    ],
  },
  {
    title: 'Payments',
    faqs: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept UPI (Google Pay, PhonePe, Paytm, etc.), debit/credit cards (Visa, Mastercard, RuPay), and net banking.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Absolutely. All transactions are processed through secure, encrypted payment gateways. We never store your card or banking details.',
      },
      {
        q: 'My payment failed but money was deducted. What do I do?',
        a: 'Don\'t worry — if the payment failed, the amount will be automatically refunded to your account within 5-7 business days. If not, contact us on WhatsApp at +91 91363 54192 with your order details.',
      },
    ],
  },
  {
    title: 'Returns & Exchange',
    faqs: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery. The product must be unused, unwashed, and in original condition with tags intact. You can view our full policy on the Return & Exchange page.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'Contact us on WhatsApp at +91 91363 54192 with your order number, photos/video of the product, and the reason for return. Our team will verify and process your request within 24-48 hours.',
      },
      {
        q: 'Can I exchange a product for a different size or color?',
        a: 'Yes, exchanges for size and color are available within 7 days of delivery, subject to stock availability.',
      },
      {
        q: 'How long does a refund take?',
        a: 'Refunds are processed within 7 business days after approval and credited to your original payment method.',
      },
    ],
  },
  {
    title: 'Products',
    faqs: [
      {
        q: 'Are the product colors accurate in the photos?',
        a: 'We try our best to display accurate colors, but slight variations may occur due to screen settings and lighting during photography.',
      },
      {
        q: 'How do I find the right size?',
        a: 'Each product page includes a size chart with detailed measurements. If you\'re unsure, feel free to WhatsApp us at +91 91363 54192 and we\'ll help you choose the right fit.',
      },
      {
        q: 'Will I be notified if an out-of-stock item becomes available?',
        a: 'Currently we don\'t have an auto-notify feature. You can reach out to us on WhatsApp and we\'ll let you know when the item is back in stock.',
      },
      {
        q: 'What fabric care instructions should I follow?',
        a: 'Care instructions are mentioned on the product label and product page. Generally, we recommend washing in cold water, avoiding bleach, and air drying for best results.',
      },
    ],
  },
  {
    title: 'Account & General',
    faqs: [
      {
        q: 'Do I need an account to place an order?',
        a: 'Yes, creating an account helps you track orders, view order history, and manage your wishlist easily.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Go to the login page and click "Forgot Password." You\'ll receive a reset link on your registered email.',
      },
      {
        q: 'Do you have a physical store?',
        a: 'We are currently an online-only store based in Nasaratpur, Samudraghar, Purba Bardhaman, West Bengal - 713519.',
      },
      {
        q: 'Do you offer wholesale or bulk orders?',
        a: 'Yes, we are open to wholesale inquiries. Please contact us on WhatsApp at +91 91363 54192 to discuss bulk pricing and availability.',
      },
      {
        q: 'How can I contact customer support?',
        a: 'You can reach us via WhatsApp or call at +91 91363 54192 or +91 91377 94645, Monday to Saturday, 10 AM – 7 PM.',
      },
    ],
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-primary/5 py-12 lg:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find answers to common questions about orders, shipping, payments, and more.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 lg:py-16 max-w-3xl space-y-10">
        {faqSections.map((section, idx) => (
          <section key={idx}>
            <h2 className="font-serif text-xl font-bold mb-4 pb-2 border-b border-border">
              {section.title}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {section.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`${idx}-${i}`}>
                  <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        {/* Still have questions */}
        <div className="text-center bg-secondary/30 rounded-xl p-8">
          <h3 className="font-serif text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            We're here to help! Reach out to us anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/919136354192"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
            <Link
              to="/return-exchange"
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-secondary/50 transition-colors"
            >
              View Return Policy
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
