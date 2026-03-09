import { useState } from 'react';
import {
  Search,
  MapPin,
  Plus,
  Navigation,
  Edit2,
  Trash2,
  Share2,
  Home,
  Briefcase,
  Heart,
  Loader2,
  Check,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import MapPicker from '@/components/MapPicker';

interface AddressManagerProps {
  addresses: Address[];
  onAddressesChange: (addresses: Address[]) => void;
}

type AddressType = 'home' | 'work' | 'other';

const addressTypeIcons: Record<AddressType, typeof Home> = {
  home: Home,
  work: Briefcase,
  other: Heart,
};

const AddressManager = ({ addresses, onAddressesChange }: AddressManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [locatingUser, setLocatingUser] = useState(false);
  const [selectedType, setSelectedType] = useState<AddressType>('home');
  const [expandedAddressId, setExpandedAddressId] = useState<string | null>(null);

  const filteredAddresses = addresses.filter((addr) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      addr.fullName.toLowerCase().includes(q) ||
      addr.address.toLowerCase().includes(q) ||
      addr.city.toLowerCase().includes(q) ||
      addr.state.toLowerCase().includes(q) ||
      addr.pincode.includes(q) ||
      (addr.landmark && addr.landmark.toLowerCase().includes(q))
    );
  });

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use reverse geocoding via a free API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await res.json();
          const addr = data.address || {};
          setEditingAddress({
            id: '',
            fullName: '',
            phone: '',
            address: [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            pincode: addr.postcode || '',
            landmark: '',
            isDefault: addresses.length === 0,
          });
          setSelectedType('home');
          setIsFormOpen(true);
          toast.success('Location detected! Please verify and fill remaining details.');
        } catch {
          toast.error('Could not fetch address from location');
        } finally {
          setLocatingUser(false);
        }
      },
      () => {
        setLocatingUser(false);
        toast.error('Location access denied. Please enable location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapLocationSelect = (location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
    displayName: string;
  }) => {
    setEditingAddress({
      id: '',
      fullName: '',
      phone: '',
      address: location.address || location.displayName.split(',').slice(0, 2).join(','),
      city: location.city,
      state: location.state,
      pincode: location.pincode,
      landmark: '',
      isDefault: addresses.length === 0,
    });
    setSelectedType('home');
    setIsFormOpen(true);
    toast.success('Location selected! Please fill in remaining details.');
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setAddressErrors({});
    setSelectedType('home');
    setIsFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setAddressErrors({});
    setIsFormOpen(true);
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
      landmark: (formData.get('landmark') as string) || undefined,
    };

    const result = addressSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setAddressErrors(errors);
      return;
    }
    setAddressErrors({});

    if (editingAddress && editingAddress.id) {
      onAddressesChange(
        addresses.map((a) => (a.id === editingAddress.id ? { ...a, ...data } : a))
      );
      toast.success('Address updated!');
    } else {
      const newAddress: Address = {
        id: Date.now().toString(),
        ...data,
        isDefault: addresses.length === 0,
      };
      onAddressesChange([...addresses, newAddress]);
      toast.success('Address added!');
    }
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  const handleDelete = (id: string) => {
    onAddressesChange(addresses.filter((a) => a.id !== id));
    toast.success('Address deleted!');
  };

  const handleSetDefault = (id: string) => {
    onAddressesChange(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    toast.success('Default address updated!');
  };

  const handleShare = async (address: Address) => {
    const text = `${address.fullName}\n${address.address}${address.landmark ? `, ${address.landmark}` : ''}\n${address.city}, ${address.state} - ${address.pincode}\nPhone: ${address.phone}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Delivery Address', text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Address copied to clipboard!');
    }
  };

  const getAddressIcon = (_address: Address) => {
    // Simple heuristic for icon
    return Home;
  };

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="bg-card rounded-t-xl border border-border p-5 pb-4">
        <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
          <MapPin size={22} className="text-primary" />
          Select Your Location
        </h2>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search an area or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-card border-x border-border px-5 py-4">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleUseCurrentLocation}
            disabled={locatingUser}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border group"
          >
            {locatingUser ? (
              <Loader2 size={22} className="text-primary animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Navigation size={18} className="text-primary" />
              </div>
            )}
            <span className="text-xs font-medium text-center leading-tight">
              Use Current Location
            </span>
          </button>

          <button
            onClick={handleAddNew}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border group"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <Plus size={18} className="text-accent" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              Add New Address
            </span>
          </button>

          <button
            onClick={() => setIsMapOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border group"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Map size={18} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              Pick on Map
            </span>
          </button>
        </div>
      </div>

      {/* Saved Addresses */}
      <div className="bg-card rounded-b-xl border border-t-0 border-border px-5 py-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Saved Addresses
        </h3>

        {filteredAddresses.length === 0 ? (
          <div className="text-center py-10">
            <MapPin size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No addresses match your search' : 'No saved addresses yet'}
            </p>
            {!searchQuery && (
              <Button variant="link" onClick={handleAddNew} className="mt-2 text-primary">
                Add your first address
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAddresses.map((address) => {
              const Icon = getAddressIcon(address);
              const isExpanded = expandedAddressId === address.id;

              return (
                <div
                  key={address.id}
                  className={`relative rounded-xl border transition-all duration-200 ${
                    address.isDefault
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  {/* Main Row */}
                  <button
                    onClick={() => {
                      handleSetDefault(address.id);
                      setExpandedAddressId(isExpanded ? null : address.id);
                    }}
                    className="w-full flex items-start gap-3 p-4 text-left"
                  >
                    <div
                      className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        address.isDefault
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{address.fullName || 'Home'}</span>
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
                            <Check size={10} />
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {address.address}
                        {address.landmark && `, ${address.landmark}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                  </button>

                  {/* Expanded Actions */}
                  {(isExpanded || address.isDefault) && (
                    <div className="flex items-center gap-1 px-4 pb-3 pt-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs gap-1.5 text-primary hover:text-primary"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit2 size={13} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs gap-1.5 text-muted-foreground"
                        onClick={() => handleShare(address)}
                      >
                        <Share2 size={13} />
                        Share
                      </Button>
                      {!address.isDefault && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={13} />
                              Delete
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
                              <AlertDialogAction onClick={() => handleDelete(address.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {address.isDefault && addresses.length > 1 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={13} />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Default Address?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove your default address. Another address will become the default.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(address.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Address Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              {editingAddress?.id ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>

          {/* Address Type Selector */}
          <div className="flex gap-2 mb-2">
            {(['home', 'work', 'other'] as AddressType[]).map((type) => {
              const TypeIcon = addressTypeIcons[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                    selectedType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TypeIcon size={13} />
                  {type}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSaveAddress} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                <Input id="fullName" name="fullName" defaultValue={editingAddress?.fullName} placeholder="" className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
                {addressErrors.fullName && <p className="text-[11px] text-destructive">{addressErrors.fullName}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs">Phone</Label>
                <Input id="phone" name="phone" defaultValue={editingAddress?.phone} placeholder="" className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
                {addressErrors.phone && <p className="text-[11px] text-destructive">{addressErrors.phone}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs">Address</Label>
              <Input id="address" name="address" defaultValue={editingAddress?.address} placeholder="" className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
              {addressErrors.address && <p className="text-[11px] text-destructive">{addressErrors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs">City</Label>
                <Input id="city" name="city" defaultValue={editingAddress?.city} placeholder="" className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
                {addressErrors.city && <p className="text-[11px] text-destructive">{addressErrors.city}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="state" className="text-xs">State</Label>
                <Input id="state" name="state" defaultValue={editingAddress?.state} placeholder="" className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
                {addressErrors.state && <p className="text-[11px] text-destructive">{addressErrors.state}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pincode" className="text-xs">PIN Code</Label>
                <Input id="pincode" name="pincode" defaultValue={editingAddress?.pincode} placeholder="400001" className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
                {addressErrors.pincode && <p className="text-[11px] text-destructive">{addressErrors.pincode}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="landmark" className="text-xs">Landmark</Label>
                <Input id="landmark" name="landmark" defaultValue={editingAddress?.landmark} placeholder="Near..." className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingAddress?.id ? 'Update Address' : 'Save Address'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map Picker */}
      <MapPicker
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSelect={handleMapLocationSelect}
      />
    </div>
  );
};

export default AddressManager;
