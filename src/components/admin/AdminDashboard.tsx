import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IndianRupee, ShoppingCart, Users,
  Clock, TrendingUp, Download, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminDashboardProps {
  analytics: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    paidRevenue: number;
    averageOrderValue: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
  };
}

const KPI_CARDS = [
  { key: 'totalRevenue', label: 'Total Revenue', icon: IndianRupee, color: 'text-purple-600', format: 'currency' },
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingCart, color: 'text-green-700', format: 'number' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: Clock, color: 'text-orange-500', format: 'number' },
  { key: 'totalCustomers', label: 'Total Customers', icon: Users, color: 'text-indigo-500', format: 'number' },
  { key: 'paidRevenue', label: 'Paid Revenue', icon: TrendingUp, color: 'text-emerald-600', format: 'currency' },
  { key: 'averageOrderValue', label: 'Avg. Order Value', icon: IndianRupee, color: 'text-amber-600', format: 'currency' },
] as const;

const AdminDashboard = ({ analytics }: AdminDashboardProps) => {
  const [exporting, setExporting] = useState(false);

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-export-data');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `muffi-gout-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Backup downloaded! ${Object.values(data.counts).reduce((a: number, b: any) => a + b, 0)} total records exported.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const getValue = (key: string) => {
    return (analytics as any)[key] ?? 0;
  };

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') return `₹${Math.round(value).toLocaleString('en-IN')}`;
    return value.toLocaleString('en-IN');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Dashboard Overview</h2>
        <Button onClick={handleExportBackup} disabled={exporting} variant="outline" size="sm">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          {exporting ? 'Exporting...' : 'Download Backup'}
        </Button>
      </div>

      <div className="space-y-4">
        {KPI_CARDS.map(({ key, label, icon: Icon, color, format }) => {
          const value = getValue(key);
          return (
            <Card key={key} className="border border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold mt-1">{formatValue(value, format)}</p>
                  </div>
                  <Icon className={`h-10 w-10 ${color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Products */}
      {analytics.topProducts.length > 0 && (
        <div className="mt-8">
          <h3 className="font-serif text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {analytics.topProducts.map((product, i) => (
              <Card key={i} className="border border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                    </div>
                    <span className="text-sm font-bold">₹{product.revenue.toLocaleString('en-IN')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
