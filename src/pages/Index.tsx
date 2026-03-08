import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RefreshCw, Shield, Headphones, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useDbProducts } from '@/hooks/useDbProducts';

import heroBanner from '@/assets/hero-banner.jpg';
import categoryMen from '@/assets/category-men.jpg';

const Index = () => {
  const { products, loading } = useDbProducts();
  const featuredProducts = products.slice(0, 8);

  const categories = [
    { name: 'Men', image: categoryMen, href: '/products?category=men' },
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: RefreshCw, title: 'Easy Returns', desc: '7 days return policy' },
    { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
    { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[70vh] lg:h-[85vh] overflow-hidden">
        <img
          src={heroBanner}
          alt="New Collection"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-xl animate-slide-up">
              <span className="inline-block badge-new mb-4 rounded-full px-4 py-1.5">
                NEW COLLECTION
              </span>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Autumn Winter
                <br />
                <span className="text-primary">Collection 2024</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Discover our latest men's arrivals featuring premium fabrics and timeless
                designs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild className="group">
                  <Link to="/products">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/products?sale=true">View Sale</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore our curated men's collection
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className="group relative h-[400px] lg:h-[500px] overflow-hidden rounded-lg"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-cream">
                  <h3 className="font-serif text-2xl font-bold mb-2">{cat.name}</h3>
                  <span className="inline-flex items-center text-sm font-medium uppercase tracking-wider group-hover:underline">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-4">
                Featured Products
              </h2>
              <p className="text-muted-foreground">
                Handpicked styles loved by our customers
              </p>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/products">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-16">No products available yet.</p>
          )}

          <div className="text-center mt-8 md:hidden">
            <Button variant="outline" asChild>
              <Link to="/products">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Discount Banner */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden bg-primary p-8 lg:p-16 text-primary-foreground">
            <div className="relative z-10 max-w-xl">
              <span className="inline-block bg-primary-foreground/20 px-4 py-1 rounded-full text-sm font-medium mb-4">
                LIMITED TIME OFFER
              </span>
              <h2 className="font-serif text-3xl lg:text-5xl font-bold mb-4">
                Get 30% Off
                <br />
                Your First Order
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Sign up for our newsletter and receive an exclusive discount code.
                Plus, be the first to know about new arrivals and sales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:border-primary-foreground"
                />
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Subscribe
                </Button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                fill="currentColor"
              >
                <circle cx="100" cy="100" r="100" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
