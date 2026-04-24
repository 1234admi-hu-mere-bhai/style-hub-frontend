import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffContext } from '@/hooks/useStaffContext';
import {
  Loader2, ShieldAlert, LayoutDashboard, ShoppingCart, Users,
  CreditCard, BarChart3, LogOut, Package, Warehouse,
  Tag, Bell, FileText, Menu, X, ChevronRight, Store, MessageSquare, Zap, Undo2, Megaphone,
  UsersRound, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import logoNew from '@/assets/logo-new.png';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminCustomers from '@/components/admin/AdminCustomers';
import AdminPayments from '@/components/admin/AdminPayments';
import AdminInventory from '@/components/admin/AdminInventory';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminCoupons from '@/components/admin/AdminCoupons';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminBlog from '@/components/admin/AdminBlog';
import AdminReviews from '@/components/admin/AdminReviews';
import AdminFlashSales from '@/components/admin/AdminFlashSales';
import AdminReturns from '@/components/admin/AdminReturns';
import AdminPushCampaigns from '@/components/admin/AdminPushCampaigns';
import AdminStaff from '@/components/admin/AdminStaff';
import AdminPendingApprovals from '@/components/admin/AdminPendingApprovals';

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  statusCounts: Record<string, number>;
  paymentMethods: Record<string, number>;
  revenueByDay: Record<string, number>;
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: any[];
  allOrders: any[];
  customers: any[];
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, ownerOnly: false },
  { key: 'orders', label: 'Orders', icon: ShoppingCart, ownerOnly: false },
  { key: 'returns', label: 'Returns', icon: Undo2, ownerOnly: false },
  { key: 'products', label: 'Products', icon: Package, ownerOnly: false },
  { key: 'customers', label: 'Client Data', icon: Users, ownerOnly: false },
  { key: 'payments', label: 'Payments', icon: CreditCard, ownerOnly: false },
  { key: 'inventory', label: 'Inventory', icon: Warehouse, ownerOnly: false },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, ownerOnly: false },
  { key: 'coupons', label: 'Coupons', icon: Tag, ownerOnly: false },
  { key: 'flash-sales', label: 'Flash Sales', icon: Zap, ownerOnly: false },
  { key: 'reviews', label: 'Reviews', icon: MessageSquare, ownerOnly: false },
  { key: 'notifications', label: 'Notifications', icon: Bell, ownerOnly: false },
  { key: 'push-campaigns', label: 'Push Campaigns', icon: Megaphone, ownerOnly: false },
  { key: 'blog', label: 'Blog', icon: FileText, ownerOnly: false },
  { key: 'pending-approvals', label: 'Pending Approvals', icon: ClipboardList, ownerOnly: true },
  { key: 'staff', label: 'Staff', icon: UsersRound, ownerOnly: true },
] as const;

type TabKey = typeof TABS[number]['key'];

const Admin = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const staffCtx = useStaffContext();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>((searchParams.get('tab') as TabKey) || 'dashboard');
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Admin login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      return;
    }
    if (user) {
      fetchAnalytics();
    }
  }, [user, authLoading]);

  // Pending count for owner badge
  useEffect(() => {
    if (!staffCtx.isOwner) return;
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const { data } = await supabase.functions.invoke('staff-pending-changes', {
          body: { action: 'count' },
        });
        if (!cancelled && typeof data?.count === 'number') setPendingCount(data.count);
      } catch {}
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [staffCtx.isOwner, activeTab]);

  useEffect(() => {
    if (activeTab === 'inventory' && analytics) {
      fetchDbProducts();
    }
  }, [activeTab, analytics]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
    setSidebarOpen(false);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-analytics');
      if (fnError) throw fnError;
      if (data?.error) { setError(data.error); return; }
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchDbProducts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-products', {
        body: { action: 'list' },
      });
      if (!error && data?.products) setDbProducts(data.products);
    } catch {}
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/muffigout-control-panel');
  };

  const [adminFieldErrors, setAdminFieldErrors] = useState<Record<string, string>>({});

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!loginEmail.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) errors.email = 'Please enter a valid email';
    if (!loginPassword.trim()) errors.password = 'Password is required';
    else if (loginPassword.length < 6) errors.password = 'Password must be at least 6 characters';
    if (Object.keys(errors).length > 0) { setAdminFieldErrors(errors); return; }
    setAdminFieldErrors({});
    setLoginLoading(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <img src={logoNew} alt="Muffigout" className="h-16 w-16 rounded-full shadow-md mb-4" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to manage your store</p>
          </div>
          <form onSubmit={handleAdminLogin} className="bg-card rounded-xl shadow-lg border border-border p-6 space-y-4">
            {loginError && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">{loginError}</div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setAdminFieldErrors(prev => ({ ...prev, email: '' })); }}
                placeholder="Email Address"
                className={adminFieldErrors.email ? 'border-destructive' : ''}
              />
              {adminFieldErrors.email && <p className="text-xs text-destructive">{adminFieldErrors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setAdminFieldErrors(prev => ({ ...prev, password: '' })); }}
                placeholder="Password"
                className={adminFieldErrors.password ? 'border-destructive' : ''}
              />
              {adminFieldErrors.password && <p className="text-xs text-destructive">{adminFieldErrors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loginLoading}>
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
            <div className="text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                ← Back to Store
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (authLoading || loading || staffCtx.loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading admin panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-4 p-6">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h2 className="font-serif text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>Go to Store</Button>
          <Button variant="outline" onClick={handleLogout}>Sign Out & Retry</Button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  // Filter tabs based on staff permissions / owner status
  const visibleTabs = TABS.filter((t) => {
    if (t.ownerOnly) return staffCtx.isOwner;
    if (staffCtx.isOwner) return true;
    return staffCtx.can(t.key);
  });

  // If current tab is hidden for this user, fall back to first visible
  const currentTab = visibleTabs.some((t) => t.key === activeTab) ? activeTab : visibleTabs[0]?.key ?? 'dashboard';

  return (
    <div className="min-h-screen bg-muted flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border
        flex flex-col transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <img src={logoNew} alt="Muffigout" className="h-9 w-9 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm font-bold truncate">MUFFIGOUT</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {staffCtx.isOwner ? 'Owner' : 'Staff'} Panel
            </p>
          </div>
          <button className="lg:hidden p-1 hover:bg-muted rounded" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {visibleTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {key === 'pending-approvals' && pendingCount > 0 && (
                <Badge variant={currentTab === key ? 'secondary' : 'destructive'} className="text-[10px] h-5 px-1.5">
                  {pendingCount}
                </Badge>
              )}
              {currentTab === key && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ))}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Store className="h-4 w-4" />
            Visit Store
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="border-t border-border px-4 py-3">
          <p className="text-xs font-medium truncate text-foreground">
            {staffCtx.displayName || user?.email}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {staffCtx.isOwner ? 'Owner' : 'Staff'}{staffCtx.displayName ? ` · ${user?.email}` : ''}
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-6 py-3 flex items-center gap-3">
          <button className="lg:hidden p-2 -ml-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-serif text-lg font-bold text-foreground">
            {visibleTabs.find(t => t.key === currentTab)?.label}
          </h1>
          <Button variant="ghost" size="sm" onClick={fetchAnalytics} className="ml-auto text-xs">
            Refresh
          </Button>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-5xl mx-auto w-full">
          {currentTab === 'dashboard' && <AdminDashboard analytics={analytics} />}
          {currentTab === 'orders' && <AdminOrders orders={analytics.allOrders} onRefresh={fetchAnalytics} />}
          {currentTab === 'returns' && <AdminReturns orders={analytics.allOrders} onRefresh={fetchAnalytics} />}
          {currentTab === 'products' && <AdminProducts />}
          {currentTab === 'customers' && <AdminCustomers customers={analytics.customers} />}
          {currentTab === 'payments' && (
            <AdminPayments
              orders={analytics.allOrders}
              paymentMethods={analytics.paymentMethods}
              totalRevenue={analytics.totalRevenue}
              paidRevenue={analytics.paidRevenue}
            />
          )}
          {currentTab === 'inventory' && <AdminInventory products={dbProducts} />}
          {currentTab === 'analytics' && (
            <AdminAnalytics
              revenueByDay={analytics.revenueByDay}
              statusCounts={analytics.statusCounts}
              totalOrders={analytics.totalOrders}
            />
          )}
          {currentTab === 'coupons' && <AdminCoupons />}
          {currentTab === 'flash-sales' && <AdminFlashSales />}
          {currentTab === 'reviews' && <AdminReviews />}
          {currentTab === 'notifications' && <AdminNotifications />}
          {currentTab === 'push-campaigns' && <AdminPushCampaigns />}
          {currentTab === 'blog' && <AdminBlog />}
          {currentTab === 'pending-approvals' && staffCtx.isOwner && <AdminPendingApprovals />}
          {currentTab === 'staff' && staffCtx.isOwner && <AdminStaff />}
        </main>
      </div>
    </div>
  );
};

export default Admin;
