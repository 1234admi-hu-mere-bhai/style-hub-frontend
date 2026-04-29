import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Package,
  Heart,
  CreditCard,
  RefreshCw,
  Undo2,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Address } from '@/data/user';
import { addressSchema, profileSchema } from '@/lib/validations';
import AddressManager from '@/components/AddressManager';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAddresses } from '@/hooks/useAddresses';

const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'profile';
  const { user, isLoading: authLoading, signOut } = useAuth();

  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const { addresses, setAddresses } = useAddresses();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingReplacement, setRequestingReplacement] = useState<string | null>(null);
  const [requestingReturn, setRequestingReturn] = useState<string | null>(null);
  const [returnDialogOrderId, setReturnDialogOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  const handleRequestReplacement = async (orderId: string) => {
    setRequestingReplacement(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('request-replacement', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Replacement request submitted successfully');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'replacement_requested' } : o));
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit replacement request');
    } finally {
      setRequestingReplacement(null);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnDialogOrderId) return;
    if (returnReason.trim().length < 5) {
      toast.error('Please provide a return reason (at least 5 characters)');
      return;
    }
    setRequestingReturn(returnDialogOrderId);
    try {
      const { data, error } = await supabase.functions.invoke('request-return', {
        body: { orderId: returnDialogOrderId, reason: returnReason.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Return request submitted successfully');
      setOrders(prev => prev.map(o => o.id === returnDialogOrderId ? { ...o, status: 'return_requested' } : o));
      setReturnDialogOrderId(null);
      setReturnReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit return request');
    } finally {
      setRequestingReturn(null);
    }
  };
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Load profile data from Supabase
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile({
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            email: user.email || '',
            phone: profileData.phone || '',
          });
        } else {
          setProfile({ firstName: '', lastName: '', email: user.email || '', phone: '' });
        }

        // Load orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersData) {
          setOrders(ordersData.map((order: any) => ({
            id: order.id,
            orderNumber: order.order_number,
            date: order.created_at,
            status: order.status,
            deliveredAt: order.delivered_at,
            items: (order.order_items || []).map((item: any) => ({
              id: item.product_id,
              name: item.product_name,
              image: item.image || '/placeholder.svg',
              size: item.size || '-',
              color: item.color || '-',
              quantity: item.quantity,
              price: item.price,
            })),
            total: order.total,
          })));
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: User },
    { id: 'addresses', label: 'Address Book', icon: MapPin },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'wishlist', label: 'My Wishlist', icon: Heart, href: '/wishlist' },
    { id: 'payments', label: 'Payments', icon: CreditCard, href: '/payments' },
  ];

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const result = profileSchema.safeParse({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
    });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setProfileErrors(newErrors);
      return;
    }
    setProfileErrors({});
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
        })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-success bg-success/10';
      case 'shipped':
      case 'out_for_delivery':
        return 'text-primary bg-primary/10';
      case 'cancelled':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-secondary';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">My Account</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) =>
                tab.href ? (
                  <Link
                    key={tab.id}
                    to={tab.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <tab.icon size={20} />
                    <span>{tab.label}</span>
                  </Link>
                ) : (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <tab.icon size={20} />
                    <span>{tab.label}</span>
                  </button>
                )
              )}
              <Separator className="my-4" />
              <Link
                to="/settings"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              <button
                onClick={async () => { await signOut(); navigate('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-semibold text-xl mb-6">Personal Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => {
                          setProfile({ ...profile, firstName: e.target.value });
                          setProfileErrors(prev => ({ ...prev, firstName: '' }));
                        }}
                        className={profileErrors.firstName ? 'border-destructive' : ''}
                      />
                      {profileErrors.firstName && <p className="text-xs text-destructive">{profileErrors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => {
                          setProfile({ ...profile, lastName: e.target.value });
                          setProfileErrors(prev => ({ ...prev, lastName: '' }));
                        }}
                        className={profileErrors.lastName ? 'border-destructive' : ''}
                      />
                      {profileErrors.lastName && <p className="text-xs text-destructive">{profileErrors.lastName}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const newEmail = profile.email.trim().toLowerCase();
                          if (!newEmail || newEmail === user?.email) {
                            toast.error('Enter a different email address to change it');
                            return;
                          }
                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                            toast.error('Please enter a valid email address');
                            return;
                          }
                          const { error } = await supabase.auth.updateUser(
                            { email: newEmail },
                            { emailRedirectTo: `${window.location.origin}/profile` },
                          );
                          if (error) {
                            toast.error(error.message);
                            return;
                          }
                          toast.success(
                            `Verification link sent to ${newEmail}. Click it to complete the change.`,
                            { duration: 8000 },
                          );
                        }}
                      >
                        Update Email
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll send a confirmation link to your new email. The change applies only after you click it.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => {
                        setProfile({ ...profile, phone: e.target.value });
                        setProfileErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      className={profileErrors.phone ? 'border-destructive' : ''}
                    />
                    {profileErrors.phone && <p className="text-xs text-destructive">{profileErrors.phone}</p>}
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>

                <Separator className="my-8" />

                <div>
                  <h3 className="font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow rounded-full px-6 h-11 font-semibold">
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <AddressManager
                addresses={addresses}
                onAddressesChange={setAddresses}
              />
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-xl mb-6">Order History</h2>

                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start shopping to see your orders here
                    </p>
                    <Button asChild>
                      <Link to="/products">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-card rounded-lg border border-border overflow-hidden"
                    >
                      <div className="p-4 bg-secondary/30 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.orderNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Placed on{' '}
                            {new Date(order.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                          <Link
                            to={`/track-order?id=${order.orderNumber}`}
                            className="text-sm text-primary hover:underline flex items-center"
                          >
                            Track Order
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                      <div className="p-4">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className={`flex gap-4 ${
                              index > 0 ? 'mt-4 pt-4 border-t border-border' : ''
                            }`}
                          >
                            <div className="w-16 h-20 bg-secondary rounded overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Size: {item.size} | Color: {item.color} | Qty:{' '}
                                {item.quantity}
                              </p>
                              <p className="font-semibold mt-1">
                                ₹{item.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-secondary/30 flex flex-wrap justify-between items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {order.items.length} item(s)
                        </span>
                        <div className="flex items-center gap-3">
                          {order.status === 'delivered' && (() => {
                            if (!order.deliveredAt) return true;
                            const days = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
                            return days <= 7;
                          })() && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              onClick={() => handleRequestReplacement(order.id)}
                              disabled={requestingReplacement === order.id}
                            >
                              {requestingReplacement === order.id ? (
                                <Loader2 size={14} className="mr-1 animate-spin" />
                              ) : (
                                <RefreshCw size={14} className="mr-1" />
                              )}
                              Replace
                            </Button>
                          )}
                          {order.status === 'delivered' && (() => {
                            if (!order.deliveredAt) return true;
                            const days = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
                            return days <= 7;
                          })() && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => setReturnDialogOrderId(order.id)}
                            >
                              <Undo2 size={14} className="mr-1" />
                              Return
                            </Button>
                          )}
                          <span className="font-semibold">
                            Total: ₹{order.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Return Reason Dialog */}
      <Dialog open={!!returnDialogOrderId} onOpenChange={(open) => { if (!open) { setReturnDialogOrderId(null); setReturnReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>Please tell us why you'd like to return this order.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the reason for return (e.g., wrong size, defective item, not as described)..."
            value={returnReason}
            onChange={e => setReturnReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReturnDialogOrderId(null); setReturnReason(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRequestReturn}
              disabled={requestingReturn === returnDialogOrderId || returnReason.trim().length < 5}
            >
              {requestingReturn === returnDialogOrderId ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Submit Return Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
