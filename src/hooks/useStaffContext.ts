import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type StaffPermissions = Record<string, boolean> | '*';

export interface StaffContext {
  loading: boolean;
  isOwner: boolean;
  isActive: boolean;
  email: string;
  displayName: string | null;
  permissions: StaffPermissions;
  can: (module: string) => boolean;
  refetch: () => Promise<void>;
}

const DEFAULT_CTX: StaffContext = {
  loading: true,
  isOwner: false,
  isActive: false,
  email: '',
  displayName: null,
  permissions: {},
  can: () => false,
  refetch: async () => {},
};

export function useStaffContext(): StaffContext {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<StaffContext, 'can' | 'refetch'>>(DEFAULT_CTX);

  const fetchMe = useCallback(async () => {
    if (!user) {
      setState({ ...DEFAULT_CTX, loading: false });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('staff-management', {
        body: { action: 'me' },
      });
      if (error) throw error;
      setState({
        loading: false,
        isOwner: !!data?.is_owner,
        isActive: !!data?.is_active,
        email: data?.email || '',
        displayName: data?.display_name || null,
        permissions: data?.permissions ?? {},
      });
    } catch {
      setState({ ...DEFAULT_CTX, loading: false });
    }
  }, [user]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const can = useCallback(
    (module: string) => {
      if (state.permissions === '*') return true;
      return !!state.permissions[module];
    },
    [state.permissions],
  );

  return { ...state, can, refetch: fetchMe };
}
