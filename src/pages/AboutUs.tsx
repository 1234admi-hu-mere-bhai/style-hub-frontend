import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, Target, Eye, Users, Award, Sparkles } from 'lucide-react';
import logoNew from '@/assets/logo-new.png';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative bg-primary/5 py-16 lg:py-24">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <img src={logoNew} alt="Muffigout Apparel Hub" className="h-20 w-20 rounded-full mx-auto mb-6 shadow-lg" />
            <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4">Our Story</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Built on a passion for quality and a commitment to trust, Muffigout Apparel Hub was founded on a single principle —
              every man deserves clothing that is crafted with care, made to last, and priced with honesty.
            </p>
          </div>
        </section>

        {/* Brand Story */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="font-serif text-2xl lg:text-3xl font-bold mb-6 text-center">How It All Began</h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                Muffigout Apparel Hub began as a vision in Purba Bardhaman, West Bengal. We saw a clear gap in the market —
                men's fashion that was both stylish and accessible, without compromising on quality. Customers were too often forced
                to choose between great design and genuine value.
              </p>
              <p>
                We set out to change that. Starting with a carefully curated range of men's essentials, we focused on what truly matters:
                <strong className="text-foreground"> premium fabrics, refined craftsmanship, and designs that speak for themselves.</strong>
              </p>
              <p>
                Today, Muffigout Apparel Hub is a trusted destination for discerning men who value quality and style.
                Every piece in our collection is handpicked and inspected to meet our standards before it reaches your wardrobe.
              </p>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-16 lg:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3">Our Mission</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  To make high-quality, considered menswear accessible to every customer — designed for comfort,
                  built to last, and priced with integrity.
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3">Our Vision</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  To become India's most trusted men's fashion brand — recognised for uncompromising quality,
                  ethical practices, and a customer-first approach that raises industry standards.
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3">Our Promise</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every product carries our promise of quality. If anything falls short of your expectations,
                  we'll make it right. Your trust is the foundation of everything we do.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="font-serif text-2xl lg:text-3xl font-bold mb-10 text-center">What We Stand For</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Award,
                  title: 'Uncompromising Quality',
                  desc: 'We source only premium fabrics and partner with skilled craftsmen to ensure every stitch meets our standards.',
                },
                {
                  icon: Users,
                  title: 'Customer First',
                  desc: 'Your satisfaction drives everything we do — from product selection to after-sale support and easy returns.',
                },
                {
                  icon: Sparkles,
                  title: 'Honest Pricing',
                  desc: 'No inflated MRPs, no fake discounts. We believe in transparent, fair pricing that gives you real value.',
                },
                {
                  icon: Heart,
                  title: 'Built on Trust',
                  desc: "Trust isn\u2019t just a word for us \u2014 it\u2019s the foundation of our brand. We deliver exactly what we promise.",
                },
              ].map((value, idx) => (
                <div key={idx} className="flex gap-4 p-5 rounded-xl border border-border bg-card">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-4">Crafted with Trust, Worn with Pride</h2>
            <p className="text-primary-foreground/80 mb-8">
              Join the customers who trust Muffigout Apparel Hub for considered men's fashion.
              Experience the difference of genuine craftsmanship.
            </p>
            <a
              href="/products"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold px-8 py-3 rounded-lg hover:bg-primary-foreground/90 transition-colors"
            >
              Explore the Collection
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
