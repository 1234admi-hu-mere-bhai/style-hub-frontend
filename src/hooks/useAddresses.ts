import { useState, useEffect, useCallback } from 'react';
import { Address } from '@/data/user';

const STORAGE_KEY = 'saved_addresses';

const loadAddresses = (): Address[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveAddresses = (addresses: Address[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
};

export const useAddresses = () => {
  const [addresses, setAddressesState] = useState<Address[]>(loadAddresses);

  // Sync across tabs/components
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setAddressesState(loadAddresses());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setAddresses = useCallback((newAddresses: Address[] | ((prev: Address[]) => Address[])) => {
    setAddressesState((prev) => {
      const result = typeof newAddresses === 'function' ? newAddresses(prev) : newAddresses;
      saveAddresses(result);
      return result;
    });
  }, []);

  const getDefaultAddress = useCallback((): Address | undefined => {
    const addrs = loadAddresses();
    return addrs.find((a) => a.isDefault) || addrs[0];
  }, []);

  return { addresses, setAddresses, getDefaultAddress };
};
