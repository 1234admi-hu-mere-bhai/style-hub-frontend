import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  image: string;
  stock_quantity: number;
  low_stock_threshold: number;
  in_stock: boolean;
  subcategory: string;
}

interface AdminInventoryProps {
  products: Product[];
}

const AdminInventory = ({ products }: AdminInventoryProps) => {
  const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold);
  const outOfStock = products.filter(p => !p.in_stock || p.stock_quantity === 0);

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold mb-6">Inventory</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Low Stock Items</p>
            <p className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold text-destructive">{outOfStock.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Low Stock Alert
          </h3>
          <div className="space-y-2">
            {lowStockProducts.map(p => (
              <Card key={p.id} className="border border-orange-200">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {p.image && (
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover bg-muted"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.subcategory}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    {p.stock_quantity} left
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Stock */}
      <h3 className="text-sm font-medium mb-3">All Products Stock</h3>
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No products in inventory</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <Card key={p.id} className="border border-border/50">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{p.stock_quantity}</span>
                  {!p.in_stock && <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
