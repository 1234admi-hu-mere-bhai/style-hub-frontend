import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Headphones, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Shop', icon: ShoppingBag, path: '/products' },
  { label: 'Contact', icon: Headphones, path: '/contact' },
  { label: 'Account', icon: User, path: '/profile' },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  const handleTabClick = (path: string) => {
    const isCurrentRoute = path === '/' ? pathname === '/' : pathname.startsWith(path);

    if (isCurrentRoute) return;

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
