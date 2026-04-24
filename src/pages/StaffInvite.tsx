import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import logoNew from '@/assets/logo-new.png';

const StaffInvite = () => {
  const { token } = useParams<{ token: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'accepting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Stash token before redirecting to /auth so we can resume after login
  useEffect(() => {
    if (token) sessionStorage.setItem('pending_staff_invite_token', token);
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setStatus('accepting');
    setError('');
    try {
      const { data, error } = await supabase.functions.invoke('staff-accept-invite', {
        body: { token },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      sessionStorage.removeItem('pending_staff_invite_token');
      setStatus('success');
      setTimeout(() => navigate('/muffigout-control-panel'), 1500);
    } catch (e: any) {
      setError(e.message || 'Could not accept invite');
      setStatus('error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border p-6">
        <div className="flex flex-col items-center mb-5">
          <img src={logoNew} alt="Muffigout" className="h-14 w-14 rounded-full mb-3" />
          <h1 className="font-serif text-xl font-bold">Staff invite</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            You've been invited to join the Muffigout admin panel.
          </p>
        </div>

        {!user ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Please sign in with the email this invite was sent to, then come back to this link.
            </p>
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Sign in to continue
            </Button>
          </div>
        ) : status === 'success' ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <p className="font-medium">You're in! Redirecting to the admin panel…</p>
          </div>
        ) : status === 'error' ? (
          <div className="text-center space-y-3">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>Back to store</Button>
              <Button onClick={accept}>Try again</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
            <Button className="w-full" onClick={accept} disabled={status === 'accepting'}>
              {status === 'accepting' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Accept invite
            </Button>
            <Link to="/" className="text-xs text-muted-foreground text-center block hover:text-primary">
              ← Back to store
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffInvite;
