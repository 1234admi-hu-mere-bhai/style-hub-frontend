import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Package,
  Heart,
  CreditCard,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { addressSchema } from '@/lib/validations';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'profile';
  const { user, isLoading: authLoading, signOut } = useAuth();

  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [requestingReplacement, setRequestingReplacement] = useState<string | null>(null);

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

  // Redirect if not logged in
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

  const handleSaveAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      pincode: formData.get('pincode') as string,
      landmark: formData.get('landmark') as string || undefined,
    };

    const result = addressSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setAddressErrors(errors);
      return;
    }

    setAddressErrors({});

    if (editingAddress) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingAddress.id
            ? { ...a, ...data }
            : a
        )
      );
      toast.success('Address updated successfully!');
    } else {
      const newAddress: Address = {
        id: Date.now().toString(),
        ...data,
        isDefault: addresses.length === 0,
      };
      setAddresses((prev) => [...prev, newAddress]);
      toast.success('Address added successfully!');
    }
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success('Address deleted successfully!');
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
    toast.success('Default address updated!');
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
                        onChange={(e) =>
                          setProfile({ ...profile, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) =>
                          setProfile({ ...profile, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      You'll need to verify your email if you change it
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
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
                    <Button variant="outline">Update Password</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-xl">Saved Addresses</h2>
                  <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          setAddressErrors({});
                        }}
                      >
                        <Plus size={18} className="mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSaveAddress} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            defaultValue={editingAddress?.fullName}
                          />
                          {addressErrors.fullName && (
                            <p className="text-xs text-destructive">{addressErrors.fullName}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            defaultValue={editingAddress?.phone}
                          />
                          {addressErrors.phone && (
                            <p className="text-xs text-destructive">{addressErrors.phone}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            name="address"
                            defaultValue={editingAddress?.address}
                          />
                          {addressErrors.address && (
                            <p className="text-xs text-destructive">{addressErrors.address}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              name="city"
                              defaultValue={editingAddress?.city}
                            />
                            {addressErrors.city && (
                              <p className="text-xs text-destructive">{addressErrors.city}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              name="state"
                              defaultValue={editingAddress?.state}
                            />
                            {addressErrors.state && (
                              <p className="text-xs text-destructive">{addressErrors.state}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="pincode">PIN Code</Label>
                            <Input
                              id="pincode"
                              name="pincode"
                              defaultValue={editingAddress?.pincode}
                            />
                            {addressErrors.pincode && (
                              <p className="text-xs text-destructive">{addressErrors.pincode}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="landmark">Landmark (Optional)</Label>
                            <Input
                              id="landmark"
                              name="landmark"
                              defaultValue={editingAddress?.landmark}
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsAddressModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" className="flex-1">
                            Save Address
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No addresses saved</h3>
                    <p className="text-muted-foreground mb-4">
                      Add an address for faster checkout
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 rounded-lg border ${
                          address.isDefault
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card'
                        }`}
                      >
                        {address.isDefault && (
                          <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded mb-2">
                            Default
                          </span>
                        )}
                        <h3 className="font-semibold">{address.fullName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {address.address}
                          {address.landmark && `, ${address.landmark}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {address.phone}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAddress(address);
                              setAddressErrors({});
                              setIsAddressModalOpen(true);
                            }}
                          >
                            <Edit2 size={14} className="mr-1" />
                            Edit
                          </Button>
                          {!address.isDefault && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetDefaultAddress(address.id)}
                              >
                                Set Default
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 size={14} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAddress(address.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
    </div>
  );
};

export default Profile;
