import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, X } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const parseHashParams = (hash: string): Record<string, string> => {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  const params: Record<string, string> = {};
  new URLSearchParams(clean).forEach((v, k) => {
    params[k] = v;
  });
  return params;
};

type Rule = { id: string; label: string; test: (pw: string) => boolean };

const RULES: Rule[] = [
  { id: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'num', label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
  { id: 'sym', label: 'One symbol (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
const STRENGTH_COLORS = [
  'bg-destructive',
  'bg-destructive',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-emerald-500',
  'bg-emerald-600',
];

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

  // ---- Synchronous URL inspection on first render (no flash, no spinner delay) ----
  const initialUrlState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { hasError: false, errorMsg: null as string | null, isRecovery: false, hasToken: false };
    }
    const hashParams = parseHashParams(window.location.hash || '');
    const searchParams = new URLSearchParams(window.location.search || '');
    const urlError = hashParams.error || searchParams.get('error');
    const urlErrorDesc = hashParams.error_description || searchParams.get('error_description');
    const isRecovery =
      hashParams.type === 'recovery' || searchParams.get('type') === 'recovery';
    const hasToken = !!hashParams.access_token;
    return {
      hasError: !!urlError,
      errorMsg: urlErrorDesc?.replace(/\+/g, ' ') ?? null,
      isRecovery,
      hasToken,
    };
  }, []);

  useEffect(() => {
    let ready = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (initialUrlState.hasError) {
      setInvalidLink(true);
      setLinkErrorMsg(
        initialUrlState.errorMsg || 'This password reset link is invalid or has expired.'
      );
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && sess) ||
        (event === 'INITIAL_SESSION' && sess)
      ) {
        ready = true;
        setSessionReady(true);
        setInvalidLink(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        ready = true;
        setSessionReady(true);
      }
    });

    // Faster timeout — Supabase processes the hash within ~500ms typically.
    // 2s for non-recovery URLs, 4s when token present.
    timeoutId = setTimeout(
      () => {
        if (!ready) {
          setInvalidLink(true);
          setLinkErrorMsg(
            'This password reset link is invalid or has expired. Please request a new one.'
          );
        }
      },
      initialUrlState.hasToken || initialUrlState.isRecovery ? 4000 : 2000
    );

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialUrlState]);

  // ---- Password strength + rule evaluation ----
  const ruleResults = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );
  const passedCount = ruleResults.filter((r) => r.passed).length;
  const strengthIdx = Math.min(passedCount, STRENGTH_LABELS.length - 1);
  const allRequiredPassed =
    ruleResults.find((r) => r.id === 'len')?.passed &&
    ruleResults.find((r) => r.id === 'upper')?.passed &&
    ruleResults.find((r) => r.id === 'lower')?.passed &&
    ruleResults.find((r) => r.id === 'num')?.passed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!allRequiredPassed) {
      setErrors({ password: 'Please meet all password requirements below.' });
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
    await supabase.auth.signOut();
    setTimeout(() => navigate('/auth'), 2200);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="font-serif text-3xl font-bold mb-2">Set a new password</h1>
            <p className="text-muted-foreground">
              Choose a strong password to secure your MUFFIGOUT account.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            {resetSuccess ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <h2 className="font-serif text-xl font-bold mb-1">Password updated!</h2>
                  <p className="text-sm text-muted-foreground">
                    Your password has been changed successfully. Redirecting you to sign in…
                  </p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                  Go to Sign In now
                </Button>
              </div>
            ) : invalidLink ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {linkErrorMsg ||
                    'This password reset link is invalid or has expired. Please request a new one.'}
                </p>
                <Button className="w-full" onClick={() => navigate('/auth?forgot=1')}>
                  Request a new reset link
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                  Back to Sign In
                </Button>
              </div>
            ) : !sessionReady ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Verifying your reset link…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New password */}
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
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-1.5 flex-1 rounded-full transition-colors',
                              i < passedCount ? STRENGTH_COLORS[strengthIdx] : 'bg-muted'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-medium">
                        Strength:{' '}
                        <span
                          className={cn(
                            passedCount <= 2 && 'text-destructive',
                            passedCount === 3 && 'text-yellow-600',
                            passedCount >= 4 && 'text-emerald-600'
                          )}
                        >
                          {STRENGTH_LABELS[strengthIdx]}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Rule checklist */}
                  <ul className="space-y-1.5 pt-2">
                    {ruleResults.map((r) => (
                      <li
                        key={r.id}
                        className={cn(
                          'flex items-center gap-2 text-xs transition-colors',
                          r.passed ? 'text-emerald-600' : 'text-muted-foreground'
                        )}
                      >
                        {r.passed ? (
                          <Check size={14} className="shrink-0" />
                        ) : (
                          <X size={14} className="shrink-0 opacity-60" />
                        )}
                        <span>{r.label}</span>
                        {r.id === 'sym' && (
                          <span className="text-[10px] uppercase tracking-wide opacity-60">
                            (recommended)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confirm */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <Check size={14} /> Passwords match
                    </p>
                  )}
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    submitting ||
                    !allRequiredPassed ||
                    password !== confirmPassword ||
                    confirmPassword.length === 0
                  }
                >
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
