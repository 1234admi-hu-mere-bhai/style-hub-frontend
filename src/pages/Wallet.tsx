import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet, TOPUP_PACKS } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet as WalletIcon, ArrowLeft, Loader2, ArrowUpRight, ArrowDownLeft, Gift, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';

const PAYU_BASE_URL = 'https://secure.payu.in/_payment';

const Wallet = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { balance, transactions, loading, refresh } = useWallet();
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!authLoading && !user) {
    navigate('/auth?redirect=/wallet');
    return null;
  }

  const startTopup = async (amount: number) => {
    if (!user) return;
    if (!Number.isFinite(amount) || amount < 100) {
      toast.error('Minimum top-up is ₹100');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('wallet-topup-initiate', {
        body: { amount, firstname: user.user_metadata?.first_name || 'Customer' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Submit to PayU
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const webhookBase = `${supabaseUrl}/functions/v1/payu-webhook`;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = PAYU_BASE_URL;
      const fields: Record<string, string> = {
        key: data.key,
        txnid: data.txnid,
        amount: data.amount,
        productinfo: data.productinfo,
        firstname: data.firstname,
        email: data.email,
        phone: data.phone || '',
        surl: `${webhookBase}?status=success`,
        furl: `${webhookBase}?status=failure`,
        curl: `${webhookBase}?status=cancel`,
        hash: data.hash,
      };
      Object.entries(fields).forEach(([k, v]) => {
        const i = document.createElement('input');
        i.type = 'hidden'; i.name = k; i.value = v;
        form.appendChild(i);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (e: any) {
      toast.error(e.message || 'Failed to start top-up');
      setSubmitting(false);
    }
  };

  const customNum = Number(customAmount);
  const customValid = Number.isFinite(customNum) && customNum >= 100 && customNum <= 50000;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Balance */}
        <Card className="overflow-hidden rounded-3xl border-0 shadow-elegant bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <WalletIcon className="h-6 w-6" />
              <span className="text-sm opacity-90">Wallet Balance</span>
              <button onClick={refresh} className="ml-auto opacity-80 hover:opacity-100" aria-label="Refresh">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="text-4xl font-bold font-serif tracking-tight">
              ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs opacity-80 mt-2">Use at checkout • Never expires</p>
          </CardContent>
        </Card>

        {/* Top-up packs */}
        <h2 className="font-serif text-xl font-bold mt-8 mb-3">Add Money</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Bonus included on preset packs only. Custom amount = no bonus.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TOPUP_PACKS.map(pack => (
            <button
              key={pack.amount}
              onClick={() => startTopup(pack.amount)}
              disabled={submitting}
              className="relative rounded-2xl border-2 border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
            >
              <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0">
                <Gift size={10} className="mr-1" />+₹{pack.bonus}
              </Badge>
              <div className="text-2xl font-bold">₹{pack.amount}</div>
              <div className="text-xs text-muted-foreground mt-1">Get ₹{pack.amount + pack.bonus} in wallet</div>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium mb-2">Custom amount</p>
          <p className="text-xs text-muted-foreground mb-3">No bonus on custom amounts (₹100 – ₹50,000)</p>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d]/g, ''))}
              className="h-12 bg-secondary/40"
              min={100}
              max={50000}
            />
            <Button
              onClick={() => startTopup(customNum)}
              disabled={!customValid || submitting}
              className="h-12 rounded-full px-6"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        </div>

        {/* History */}
        <h2 className="font-serif text-xl font-bold mt-8 mb-3">Transaction History</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : transactions.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
            No transactions yet. Add money to your wallet to get started.
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const credit = tx.amount > 0;
              return (
                <Card key={tx.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full grid place-items-center ${credit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {credit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">
                        {tx.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${credit ? 'text-emerald-600' : 'text-red-600'}`}>
                        {credit ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
