import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
        <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 8, 2026</p>

        <div className="space-y-10 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using the Muffi Gout Apparel Hub website, you agree to be bound by these Terms of Service.
              If you do not agree with any part of these terms, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">2. Products & Pricing</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All prices are listed in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</li>
              <li>We reserve the right to modify prices without prior notice.</li>
              <li>Product images are for illustration purposes; actual colors may slightly vary.</li>
              <li>We strive to maintain accurate stock information but cannot guarantee availability at all times.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">3. Orders & Payment</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>An order is confirmed only after successful payment processing.</li>
              <li>We accept payments via UPI, credit/debit cards, and net banking.</li>
              <li>We reserve the right to cancel orders if fraud or unauthorized activity is suspected.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">4. Shipping & Delivery</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Free shipping on orders above ₹999.</li>
              <li>Estimated delivery times are provided at checkout and may vary based on location.</li>
              <li>We are not responsible for delays caused by shipping carriers or unforeseen circumstances.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">5. Returns & Exchanges</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Returns are accepted within 7 days of delivery.</li>
              <li>Items must be unworn, unwashed, and in original packaging with tags attached.</li>
              <li>Refunds will be processed to the original payment method within 5-7 business days after inspection.</li>
              <li>For more details, visit our <a href="/return-exchange" className="text-primary underline">Returns & Exchange</a> page.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">6. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate and complete information during registration.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content on this website — including logos, images, text, graphics, and designs — is the property of Muffi Gout Apparel Hub
              and is protected by intellectual property laws. Unauthorized use, reproduction, or distribution is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Muffi Gout Apparel Hub shall not be liable for any indirect, incidental, or consequential damages arising from the use of our
              website or products. Our total liability shall not exceed the amount paid for the specific product in question.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">9. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts
              in Purba Bardhaman, West Bengal.
            </p>
          </section>

          <section className="bg-secondary/50 rounded-xl p-6">
            <h2 className="font-serif text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground mb-3">
              For any questions regarding these Terms of Service, reach out to us:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>📧 Email: <span className="text-foreground">supportmuffigoutapparelhub@gmail.com</span></li>
              <li>📞 Phone: <span className="text-foreground">+91 91363 54192</span></li>
              <li>📍 Address: <span className="text-foreground">Samudraghar Rail Bazar Bus Stand, Nasaratpur, Near New Lakshmi Medical Hall, Purba Bardhaman, West Bengal - 713519</span></li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
