import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-charcoal text-cream pb-16 md:pb-0">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/assets/logo-new.png" 
                alt="MUFFIGOUT APPAREL HUB" 
                className="h-14 w-auto rounded-full"
              />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl font-bold">MUFFIGOUT</span>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mt-1">Apparel Hub</span>
              </div>
            </div>
            <p className="text-cream/70 mb-6">
              Where trust meets style. We craft premium men's fashion with uncompromising quality, 
              ensuring every piece you wear reflects confidence, comfort, and lasting elegance.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/muffi_gouth_apparel_hub?igsh=MWdyZWJjMHl1bXduMw==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.facebook.com/share/1L2KedPQJv/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Facebook size={20} />
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
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/referral" className="hover:text-primary transition-colors">
                  Refer & Earn ₹100
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
                <Link to="/shipping-policy" className="hover:text-primary transition-colors">
                  Shipping Policy
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
            <Link to="/contact" className="font-semibold text-lg mb-4 block hover:text-primary transition-colors">Contact Us</Link>
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
                <span>supportmuffigoutapparelhub@gmail.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>Samudraghar Rail Bazar Bus Stand, Nasaratpur, Near New Lakshmi Medical Hall, Purba Bardhaman, West Bengal - 713519</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-cream/50">
          <p><p>© 2026 MUFFIGOUT APPAREL HUB. All rights reserved.</p>. All rights reserved.</p>
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
