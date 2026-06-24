import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAddresses } from '@/hooks/useAddresses';

export interface ActiveAddress {
  addressId?: string;
  city: string;
  pincode: string;
  state?: string;
}

interface ActiveAddressContextValue {
  active: ActiveAddress | null;
  setActive: (a: ActiveAddress | null) => void;
  setActiveFromPincode: (pincode: string, city?: string, state?: string) => void;
  setActiveFromAddressId: (id: string) => void;
}

const STORAGE_KEY = 'muffigout_active_address';
const ActiveAddressContext = createContext<ActiveAddressContextValue | undefined>(undefined);

export const ActiveAddressProvider = ({ children }: { children: ReactNode }) => {
  const { addresses, getDefaultAddress, loading } = useAddresses();
  const [active, setActiveState] = useState<ActiveAddress | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ActiveAddress) : null;
    } catch {
      return null;
    }
  });

  const setActive = useCallback((a: ActiveAddress | null) => {
    setActiveState(a);
    try {
      if (a) localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  const setActiveFromPincode = useCallback((pincode: string, city = '', state = '') => {
    setActive({ pincode, city, state });
  }, [setActive]);

  const setActiveFromAddressId = useCallback((id: string) => {
    const addr = addresses.find((a) => a.id === id);
    if (addr) setActive({ addressId: addr.id, city: addr.city, state: addr.state, pincode: addr.pincode });
  }, [addresses, setActive]);

  // Auto-seed from default address when user logs in / addresses load
  useEffect(() => {
    if (loading) return;
    if (active) {
      // If active points to a saved address that no longer exists, drop it
      if (active.addressId && !addresses.find((a) => a.id === active.addressId)) {
        const def = getDefaultAddress();
        if (def) setActive({ addressId: def.id, city: def.city, state: def.state, pincode: def.pincode });
        else setActive(null);
      }
      return;
    }
    const def = getDefaultAddress();
    if (def) setActive({ addressId: def.id, city: def.city, state: def.state, pincode: def.pincode });
  }, [loading, addresses, active, getDefaultAddress, setActive]);

  return (
    <ActiveAddressContext.Provider value={{ active, setActive, setActiveFromPincode, setActiveFromAddressId }}>
      {children}
    </ActiveAddressContext.Provider>
  );
};

export const useActiveAddress = () => {
  const ctx = useContext(ActiveAddressContext);
  if (!ctx) throw new Error('useActiveAddress must be used within ActiveAddressProvider');
  return ctx;
};
