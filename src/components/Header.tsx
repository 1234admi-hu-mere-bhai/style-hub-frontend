import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut, Package, History } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
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
import SearchCommand from './SearchCommand';
import { toast } from 'sonner';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { name: 'Home', href: '/' },
    { name: 'Men', href: '/products?category=men' },
    { name: 'Sale', href: '/products?sale=true' },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        {/* Announcement bar */}
        <div className="bg-primary text-primary-foreground py-2 text-sm font-medium overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            Free Shipping on orders above ₹999 | Use code MUFFIGOUT20 for 20% off on Men's Collection
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-3">
              <button
                className="p-2 -ml-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src="/assets/logo-new.png" 
                  alt="MUFFI GOUT APPAREL HUB" 
                  className="h-10 lg:h-12 w-auto rounded-full shadow-sm"
                />
                <div className="flex flex-col items-start leading-none">
                  <span className="font-serif text-base lg:text-lg font-bold tracking-tight text-foreground">MUFFI GOUT</span>
                  <span className="text-[9px] lg:text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mt-0.5">Apparel Hub</span>
                </div>
              </Link>
            </div>

            {/* Center: Search bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 flex-1 max-w-md mx-4 lg:mx-8 px-4 py-2.5 rounded-full border border-border bg-secondary/40 text-muted-foreground text-sm hover:bg-secondary/80 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 active:scale-[0.98] transition-all duration-200"
            >
              <Search size={16} className="text-primary/60" />
              <span>Search products...</span>
              <kbd className="ml-auto hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Right icons */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-secondary rounded-full transition-colors relative">
                    <User size={20} />
                    {user && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user ? (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Signed in</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-2">
                          <User size={16} />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="flex items-center gap-2">
                          <History size={16} />
                          Order History
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/track-order" className="flex items-center gap-2">
                          <Package size={16} />
                          Track Order
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut}
                        className="text-destructive focus:text-destructive flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/auth">Login / Sign Up</Link>
                      </DropdownMenuItem>
                    </>
                  )}
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

        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border animate-slide-down">
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

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Header;
