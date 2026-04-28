// Module catalog used in permission editor + sidebar filtering.
// Keep keys in sync with admin function permission checks.
export interface StaffModule {
  key: string;
  label: string;
  description: string;
}

export const STAFF_MODULES: StaffModule[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'View overview metrics' },
  { key: 'orders', label: 'Orders', description: 'Manage orders, refunds, tracking' },
  { key: 'returns', label: 'Returns', description: 'Approve/reject returns' },
  { key: 'products', label: 'Products', description: 'Add, edit, delete products' },
  { key: 'customers', label: 'Customers', description: 'View customer info' },
  { key: 'payments', label: 'Payments', description: 'View payment history' },
  { key: 'cashbook', label: 'Cashbook', description: 'View daily cash in/out ledger' },
  { key: 'inventory', label: 'Inventory', description: 'Update stock levels' },
  { key: 'analytics', label: 'Analytics', description: 'View revenue & trends' },
  { key: 'coupons', label: 'Coupons', description: 'Create & manage coupons' },
  { key: 'flash-sales', label: 'Flash Sales', description: 'Schedule flash deals' },
  { key: 'reviews', label: 'Reviews', description: 'Moderate reviews' },
  { key: 'notifications', label: 'Notifications', description: 'Send in-app alerts' },
  { key: 'push-campaigns', label: 'Push Campaigns', description: 'Send push notifications' },
  { key: 'blog', label: 'Blog', description: 'Write blog posts' },
];

export const DEFAULT_NEW_STAFF_PERMS: Record<string, boolean> = Object.fromEntries(
  STAFF_MODULES.map((m) => [m.key, false]),
);
