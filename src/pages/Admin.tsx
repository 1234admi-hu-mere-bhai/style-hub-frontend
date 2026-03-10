import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, ShieldAlert, LayoutDashboard, ShoppingCart, Users,
  CreditCard, BarChart3, LogOut, Package, Warehouse,
  Tag, Bell, FileText, Menu, X, ChevronRight, Store, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'customers', label: 'Client Data', icon: Users },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'inventory', label: 'Inventory', icon: Warehouse },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'coupons', label: 'Coupons', icon: Tag },
  { key: 'reviews', label: 'Reviews', icon: MessageSquare },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'blog', label: 'Blog', icon: FileText },
] as const;

type TabKey = typeof TABS[number]['key'];

const Admin = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>((searchParams.get('tab') as TabKey) || 'dashboard');
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    navigate('/admin');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Show admin login screen if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <img src={logoNew} alt="Muffi Gout" className="h-16 w-16 rounded-full shadow-md mb-4" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to manage your store</p>
          </div>
          <form onSubmit={handleAdminLogin} className="bg-card rounded-xl shadow-lg border border-border p-6 space-y-4">
            {loginError && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">{loginError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Email Address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
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

  if (authLoading || loading) {
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

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border
        flex flex-col transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <img src={logoNew} alt="Muffi Gout" className="h-9 w-9 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm font-bold truncate">MUFFI GOUT</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin Panel</p>
          </div>
          <button className="lg:hidden p-1 hover:bg-muted rounded" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              {activeTab === key && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
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

        {/* User info */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs font-medium truncate text-foreground">{user?.email}</p>
          <p className="text-[10px] text-muted-foreground">Administrator</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-6 py-3 flex items-center gap-3">
          <button className="lg:hidden p-2 -ml-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-serif text-lg font-bold text-foreground">
            {TABS.find(t => t.key === activeTab)?.label}
          </h1>
          <Button variant="ghost" size="sm" onClick={fetchAnalytics} className="ml-auto text-xs">
            Refresh
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-5xl mx-auto w-full">
          {activeTab === 'dashboard' && <AdminDashboard analytics={analytics} />}
          {activeTab === 'orders' && <AdminOrders orders={analytics.allOrders} onRefresh={fetchAnalytics} />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'customers' && <AdminCustomers customers={analytics.customers} />}
          {activeTab === 'payments' && (
            <AdminPayments
              orders={analytics.allOrders}
              paymentMethods={analytics.paymentMethods}
              totalRevenue={analytics.totalRevenue}
              paidRevenue={analytics.paidRevenue}
            />
          )}
          {activeTab === 'inventory' && <AdminInventory products={dbProducts} />}
          {activeTab === 'analytics' && (
            <AdminAnalytics
              revenueByDay={analytics.revenueByDay}
              statusCounts={analytics.statusCounts}
              totalOrders={analytics.totalOrders}
            />
          )}
          {activeTab === 'coupons' && <AdminCoupons />}
          {activeTab === 'reviews' && <AdminReviews />}
          {activeTab === 'notifications' && <AdminNotifications />}
          {activeTab === 'blog' && <AdminBlog />}
        </main>
      </div>
    </div>
  );
};

export default Admin;
