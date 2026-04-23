import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[0-9]/, 'Include at least one number');

const parseHashParams = (hash: string): Record<string, string> => {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  const params: Record<string, string> = {};
  new URLSearchParams(clean).forEach((v, k) => {
    params[k] = v;
  });
  return params;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [linkErrorMsg, setLinkErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    let ready = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // 1. Check URL for explicit Supabase auth errors
    const hashParams = parseHashParams(window.location.hash || '');
    const searchParams = new URLSearchParams(window.location.search || '');
    const urlError =
      hashParams.error || searchParams.get('error');
    const urlErrorDesc =
      hashParams.error_description ||
      searchParams.get('error_description');

    if (urlError) {
      setInvalidLink(true);
      setLinkErrorMsg(
        urlErrorDesc?.replace(/\+/g, ' ') ||
          'This password reset link is invalid or has expired.'
      );
      // Clean URL
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    const isRecovery =
      hashParams.type === 'recovery' ||
      searchParams.get('type') === 'recovery' ||
      !!hashParams.access_token;

    // 2. Listen for PASSWORD_RECOVERY / SIGNED_IN events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (
          event === 'PASSWORD_RECOVERY' ||
          (event === 'SIGNED_IN' && sess) ||
          (event === 'INITIAL_SESSION' && sess)
        ) {
          ready = true;
          setSessionReady(true);
          setInvalidLink(false);
        }
      }
    );

    // 3. Check existing session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        ready = true;
        setSessionReady(true);
      }
    });

    // 4. If no session arrives in time, show invalid-link state
    timeoutId = setTimeout(
      () => {
        if (!ready) {
          setInvalidLink(true);
          setLinkErrorMsg(
            'This password reset link is invalid or has expired. Please request a new one.'
          );
        }
      },
      isRecovery ? 8000 : 3000
    );

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setErrors({ password: result.error.errors[0].message });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Password updated successfully!');
    setResetSuccess(true);

    // Sign out so the user must log in fresh with the new password
    await supabase.auth.signOut();

    // Redirect after showing success state
    setTimeout(() => {
      navigate('/auth');
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="font-serif text-3xl font-bold mb-2">
              Set a new password
            </h1>
            <p className="text-muted-foreground">
              Choose a strong password to secure your MUFFIGOUT account.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            {resetSuccess ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <h2 className="font-serif text-xl font-bold mb-1">
                    Password updated!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your password has been changed successfully. Redirecting
                    you to sign in…
                  </p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  Go to Sign In now
                </Button>
              </div>
            ) : invalidLink ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {linkErrorMsg ||
                    'This password reset link is invalid or has expired. Please request a new one.'}
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate('/auth?forgot=1')}
                >
                  Request a new reset link
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : !sessionReady ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Min 8 characters with uppercase, lowercase, and a number.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
