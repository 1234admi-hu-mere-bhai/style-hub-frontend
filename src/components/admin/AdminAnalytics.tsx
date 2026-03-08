import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Users, Eye, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAnalyticsProps {
  revenueByDay: Record<string, number>;
  statusCounts: Record<string, number>;
  totalOrders: number;
}

const PIE_COLORS = ['hsl(16, 65%, 55%)', 'hsl(40, 70%, 50%)', 'hsl(150, 60%, 40%)', 'hsl(200, 60%, 50%)', 'hsl(280, 50%, 55%)', 'hsl(0, 60%, 55%)'];

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  visitsByDay: { date: string; visits: number; unique: number }[];
  topPages: { page: string; visits: number }[];
}

const AdminAnalytics = ({ revenueByDay, statusCounts, totalOrders }: AdminAnalyticsProps) => {
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    const fetchVisitorStats = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from('site_visits' as any)
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!data) return;

      const visits = data as any[];
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = visits.filter((v: any) => v.created_at.startsWith(today)).length;
      const uniqueIds = new Set(visits.map((v: any) => v.visitor_id));

      // Group by day
      const dayMap: Record<string, { visits: number; visitors: Set<string> }> = {};
      visits.forEach((v: any) => {
        const day = v.created_at.split('T')[0];
        if (!dayMap[day]) dayMap[day] = { visits: 0, visitors: new Set() };
        dayMap[day].visits++;
        dayMap[day].visitors.add(v.visitor_id);
      });

      const visitsByDay = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          visits: stats.visits,
          unique: stats.visitors.size,
        }));

      // Top pages
      const pageMap: Record<string, number> = {};
      visits.forEach((v: any) => {
        pageMap[v.page] = (pageMap[v.page] || 0) + 1;
      });
      const topPages = Object.entries(pageMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([page, visits]) => ({ page, visits }));

      setVisitorStats({
        totalVisits: visits.length,
        uniqueVisitors: uniqueIds.size,
        todayVisits,
        visitsByDay,
        topPages,
      });
    };

    fetchVisitorStats();
  }, []);

  const revenueChartData = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue,
    }));

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: count,
  }));

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold mb-6">Analytics</h2>

      {/* Visitor Stats Cards */}
      {visitorStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Page Views</p>
                  <p className="text-2xl font-bold">{visitorStats.totalVisits.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique Visitors</p>
                  <p className="text-2xl font-bold">{visitorStats.uniqueVisitors.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Visits</p>
                  <p className="text-2xl font-bold">{visitorStats.todayVisits.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visitor Traffic Chart */}
      {visitorStats && visitorStats.visitsByDay.length > 0 && (
        <Card className="mb-6 border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Site Traffic (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={visitorStats.visitsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="visits" stroke="hsl(16, 65%, 55%)" strokeWidth={2} name="Page Views" dot={false} />
                <Line type="monotone" dataKey="unique" stroke="hsl(200, 60%, 50%)" strokeWidth={2} name="Unique Visitors" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Pages */}
      {visitorStats && visitorStats.topPages.length > 0 && (
        <Card className="mb-6 border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visitorStats.topPages.map((page) => (
                <div key={page.page} className="flex items-center justify-between">
                  <span className="text-sm font-mono text-muted-foreground">{page.page}</span>
                  <span className="text-sm font-semibold">{page.visits} views</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart */}
      <Card className="mb-6 border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="hsl(16, 65%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-10 text-sm">No revenue data in the last 30 days</p>
          )}
        </CardContent>
      </Card>

      {/* Order Status Pie */}
      <Card className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Order Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {statusChartData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {statusChartData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10 text-sm">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
