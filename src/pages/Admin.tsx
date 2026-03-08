import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, ShieldAlert, LayoutDashboard, ShoppingCart, Users,
  CreditCard, BarChart3, ArrowLeft, LogOut, Package, Warehouse,
  Tag, Bell, FileText
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
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'inventory', label: 'Inventory', icon: Warehouse },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'coupons', label: 'Coupons', icon: Tag },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'blog', label: 'Blog', icon: FileText },
] as const;

type TabKey = typeof TABS[number]['key'];

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAnalytics();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'inventory' && analytics) {
      fetchDbProducts();
    }
  }, [activeTab, analytics]);

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
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading admin panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h2 className="font-serif text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button variant="outline" onClick={() => navigate('/')}>Go to Store</Button>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/">
            <img src={logoNew} alt="Muffi Gout" className="h-10 w-10 object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Store
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-[57px] z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
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
        {activeTab === 'notifications' && <AdminNotifications />}
        {activeTab === 'blog' && <AdminBlog />}
      </main>
    </div>
  );
};

export default Admin;
