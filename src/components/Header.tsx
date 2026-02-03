import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CartDrawer from './CartDrawer';
import AuthModal from './AuthModal';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();

  const categories = [
    { name: 'Men', href: '/products?category=men' },
    { name: 'Women', href: '/products?category=women' },
    { name: 'Kids', href: '/products?category=kids' },
    { name: 'Sale', href: '/products?sale=true' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        {/* Announcement bar */}
        <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
          Free Shipping on orders above ₹999 | Use code MUFFI20 for 20% off
        </div>

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <h1 className="font-serif text-xl lg:text-2xl font-bold tracking-tight">
                MUFFI
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.href}
                  className="text-sm font-medium uppercase tracking-wider link-underline hover:text-primary transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              <button
                className="p-2 hover:bg-secondary rounded-full transition-colors"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search size={20} />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-secondary rounded-full transition-colors relative">
                    <User size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setAuthModalOpen(true)}>
                    Login / Sign Up
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile?tab=orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile?tab=addresses">Address Book</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/track-order">Track Order</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                className="p-2 hover:bg-secondary rounded-full transition-colors relative"
                onClick={() => navigate('/wishlist')}
              >
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-secondary rounded-full transition-colors relative">
                    <ShoppingBag size={20} />
                    {totalItems > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-xl">Your Cart</SheetTitle>
                  </SheetHeader>
                  <CartDrawer onClose={() => setCartOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="pb-4 animate-slide-down">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full input-field rounded-full pl-12"
                  autoFocus
                />
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border animate-slide-down">
            <nav className="container mx-auto px-4 py-4 space-y-4">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.href}
                  className="block text-lg font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};

export default Header;
