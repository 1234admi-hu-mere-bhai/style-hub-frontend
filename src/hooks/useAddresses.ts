import { useState, useEffect, useCallback } from 'react';
import { Address } from '@/data/user';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAddresses = () => {
  const [addresses, setAddressesState] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load addresses from DB
  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddressesState([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const mapped: Address[] = (data || []).map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        landmark: row.landmark || undefined,
        isDefault: row.is_default,
      }));
      setAddressesState(mapped);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const setAddresses = useCallback(async (newAddresses: Address[] | ((prev: Address[]) => Address[])) => {
    if (!user) return;

    const result = typeof newAddresses === 'function' ? newAddresses(addresses) : newAddresses;

    // Find what changed
    const existingIds = new Set(addresses.map(a => a.id));
    const newIds = new Set(result.map(a => a.id));

    // Deleted
    const deleted = addresses.filter(a => !newIds.has(a.id));
    // Added
    const added = result.filter(a => !existingIds.has(a.id));
    // Updated
    const updated = result.filter(a => existingIds.has(a.id));

    try {
      // Process deletes
      for (const addr of deleted) {
        await supabase.from('addresses').delete().eq('id', addr.id);
      }

      // Process inserts
      for (const addr of added) {
        await supabase.from('addresses').insert({
          user_id: user.id,
          full_name: addr.fullName,
          phone: addr.phone,
          address: addr.address,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          landmark: addr.landmark || null,
          is_default: addr.isDefault,
        });
      }

      // Process updates
      for (const addr of updated) {
        await supabase.from('addresses').update({
          full_name: addr.fullName,
          phone: addr.phone,
          address: addr.address,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          landmark: addr.landmark || null,
          is_default: addr.isDefault,
        }).eq('id', addr.id);
      }

      // Refresh from DB
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to save addresses:', err);
    }
  }, [user, addresses, fetchAddresses]);

  const getDefaultAddress = useCallback((): Address | undefined => {
    return addresses.find((a) => a.isDefault) || addresses[0];
  }, [addresses]);

  return { addresses, setAddresses, getDefaultAddress, loading };
};
