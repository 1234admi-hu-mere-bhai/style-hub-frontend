import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-charcoal text-cream">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <h2 className="font-serif text-2xl font-bold mb-4">MUFFI GOUT APPAREL HUB</h2>
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
                <Link to="/products?category=men" className="hover:text-primary transition-colors">
                  Men's Collection
                </Link>
              </li>
              <li>
                <Link to="/products?category=women" className="hover:text-primary transition-colors">
                  Women's Collection
                </Link>
              </li>
              <li>
                <Link to="/products?category=kids" className="hover:text-primary transition-colors">
                  Kids' Collection
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
                <Link to="/returns" className="hover:text-primary transition-colors">
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
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={16} />
                <span>support@muffi.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>123 Fashion Street, Mumbai, India - 400001</span>
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
