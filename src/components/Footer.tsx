import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-charcoal text-cream">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/assets/logo-new.png" 
                alt="MUFFI GOUT APPAREL HUB" 
                className="h-14 w-auto rounded-full"
              />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl font-bold">MUFFI GOUT</span>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mt-1">Apparel Hub</span>
              </div>
            </div>
            <p className="text-cream/70 mb-6">
              Your destination for stylish clothing for Men,
              Women & Kids. Quality fashion at affordable prices.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Shop</h3>
            <ul className="space-y-3 text-cream/70">
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  Men's Collection
                </Link>
              </li>
              <li>
                <Link to="/products?sale=true" className="hover:text-primary transition-colors">
                  Sale & Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Help</h3>
            <ul className="space-y-3 text-cream/70">
              <li>
                <Link to="/track-order" className="hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="hover:text-primary transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link to="/return-exchange" className="hover:text-primary transition-colors">
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-cream/70">
              <li className="flex items-center space-x-3">
                <Phone size={16} />
                <span>+91 91363 54192</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={16} />
                <span>+91 91377 94645</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={16} />
                <span>support@muffi.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>Nasaratpur, Samudraghar, Purba Bardhaman, West Bengal - 713519</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-cream/50">
          <p>© 2024 MUFFI GOUT APPAREL HUB. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-cream transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-cream transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
