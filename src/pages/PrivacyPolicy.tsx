import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
        <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 8, 2026</p>

        <div className="space-y-10 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="mb-3">At Muffi Gout Apparel Hub, we collect information to provide you with the best shopping experience:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Personal Information:</strong> Name, email address, phone number, and shipping address when you place an order or create an account.</li>
              <li><strong className="text-foreground">Payment Information:</strong> Payment details are processed securely through our trusted payment partners. We do not store your card details on our servers.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Browsing behavior, device information, and IP address to improve our website and services.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Processing and fulfilling your orders</li>
              <li>Communicating order updates and delivery status</li>
              <li>Sending promotional offers and newsletters (with your consent)</li>
              <li>Improving our website, products, and customer service</li>
              <li>Preventing fraud and ensuring security</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">3. Data Sharing & Third Parties</h2>
            <p className="text-muted-foreground mb-3">
              We do <strong className="text-foreground">not sell</strong> your personal information. We may share your data only with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Payment Processors:</strong> To securely process your transactions.</li>
              <li><strong className="text-foreground">Shipping Partners:</strong> To deliver your orders to the correct address.</li>
              <li><strong className="text-foreground">Analytics Providers:</strong> To understand website usage and improve our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">4. Cookies & Tracking</h2>
            <p className="text-muted-foreground">
              We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic.
              You can manage cookie preferences through your browser settings. Disabling cookies may affect some features of our website.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures including SSL encryption, secure payment gateways, and regular security audits
              to protect your personal information. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-muted-foreground mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal data we hold</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">7. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">8. Policy Updates</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.
              We encourage you to review this page periodically.
            </p>
          </section>

          <section className="bg-secondary/50 rounded-xl p-6">
            <h2 className="font-serif text-xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-muted-foreground mb-3">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>📧 Email: <span className="text-foreground">support@muffi.com</span></li>
              <li>📞 Phone: <span className="text-foreground">+91 91363 54192</span></li>
              <li>📍 Address: <span className="text-foreground">Nasaratpur, Samudraghar, Purba Bardhaman, West Bengal - 713519</span></li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
