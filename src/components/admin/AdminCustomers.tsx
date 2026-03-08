import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

interface AdminCustomersProps {
  customers: Customer[];
}

const AdminCustomers = ({ customers }: AdminCustomersProps) => {
  return (
    <div>
      <h2 className="font-serif text-2xl font-bold mb-6">Customers ({customers.length})</h2>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No customers yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <Card key={c.id} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {(c.first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {c.first_name || ''} {c.last_name || ''}
                        {!c.first_name && !c.last_name && 'Anonymous'}
                      </p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{c.total_spent.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">{c.total_orders} order(s)</p>
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

export default AdminCustomers;
