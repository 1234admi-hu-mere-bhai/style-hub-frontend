import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, Mail, CheckCircle2, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = 'loading' | 'valid' | 'already' | 'invalid' | 'submitting' | 'done' | 'error';

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    const validate = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await res.json();
        if (!res.ok) {
          setState('invalid');
          setErrorMessage(data?.error || 'Invalid or expired link');
          return;
        }
        if (data.valid === true) setState('valid');
        else if (data.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      } catch {
        setState('invalid');
      }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState('submitting');
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if ((data as any)?.success) setState('done');
      else if ((data as any)?.reason === 'already_unsubscribed') setState('already');
      else setState('error');
    } catch (e: any) {
      setErrorMessage(e?.message || 'Something went wrong');
      setState('error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 text-center shadow-soft">
          {state === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Checking your link…</h1>
            </>
          )}

          {state === 'valid' && (
            <>
              <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Unsubscribe from emails</h1>
              <p className="text-muted-foreground mb-6">
                You'll stop receiving marketing and notification emails from MUFFIGOUT.
                Important account emails (password resets, order receipts) will still be sent.
              </p>
              <Button onClick={confirm} className="w-full">Confirm Unsubscribe</Button>
              <Link to="/" className="block text-sm text-muted-foreground mt-4 hover:text-primary">
                Cancel
              </Link>
            </>
          )}

          {state === 'submitting' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Processing…</h1>
            </>
          )}

          {state === 'done' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">You're unsubscribed</h1>
              <p className="text-muted-foreground mb-6">
                We're sorry to see you go. You can re-enable emails anytime by contacting support.
              </p>
              <Button asChild className="w-full"><Link to="/">Back to Home</Link></Button>
            </>
          )}

          {state === 'already' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Already unsubscribed</h1>
              <p className="text-muted-foreground mb-6">
                This email address is already opted out.
              </p>
              <Button asChild className="w-full"><Link to="/">Back to Home</Link></Button>
            </>
          )}

          {state === 'invalid' && (
            <>
              <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Invalid link</h1>
              <p className="text-muted-foreground mb-6">
                {errorMessage || 'This unsubscribe link is invalid or has expired.'}
              </p>
              <Button asChild className="w-full"><Link to="/contact">Contact Support</Link></Button>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-muted-foreground mb-6">{errorMessage || 'Please try again later.'}</p>
              <Button onClick={() => setState('valid')} className="w-full">Try Again</Button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
