import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Heart, User } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Shop', icon: ShoppingBag, path: '/products' },
  { label: 'Wishlist', icon: Heart, path: '/wishlist' },
  { label: 'Account', icon: User, path: '/profile' },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { items } = useWishlist();
  const { user } = useAuth();

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  const handleTabClick = (path: string) => {
    if (path === '/profile' && !user) {
      navigate('/auth');
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.path);

          return (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {tab.label === 'Wishlist' && items.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
      {/* Safe area for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
