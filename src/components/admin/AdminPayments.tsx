import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  created_at: string;
}

interface AdminPaymentsProps {
  orders: Order[];
  paymentMethods: Record<string, number>;
  totalRevenue: number;
  paidRevenue: number;
}

const AdminPayments = ({ orders, paymentMethods, totalRevenue, paidRevenue }: AdminPaymentsProps) => {
  return (
    <div>
      <h2 className="font-serif text-2xl font-bold mb-6">Payments</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold">₹{Math.round(totalRevenue).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paid Revenue</p>
            <p className="text-xl font-bold text-green-700">₹{Math.round(paidRevenue).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      {Object.keys(paymentMethods).length > 0 && (
        <Card className="mb-6 border border-border/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Payment Methods</p>
            <div className="space-y-2">
              {Object.entries(paymentMethods).map(([method, count]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm">{method}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(count / orders.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Transactions */}
      <h3 className="text-sm font-medium mb-3">All Transactions</h3>
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No payments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Card key={order.id} className="border border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs">{order.order_number}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN')} · {order.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{Number(order.total).toLocaleString('en-IN')}</p>
                    <Badge variant="outline" className={`text-[10px] ${order.payment_status === 'paid' ? 'border-green-500 text-green-700' : ''}`}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
