import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet, TOPUP_PACKS } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet as WalletIcon,
  ArrowLeft,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Sparkles,
  Info,
  HelpCircle,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import Header from '@/components/Header';

const PAYU_BASE_URL = 'https://secure.payu.in/_payment';
const MIN = 500;
const MAX = 50000;

const Wallet = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { balance, transactions, loading, refresh } = useWallet();
  const [amount, setAmount] = useState<string>('1000');
  const [submitting, setSubmitting] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const navigate = useNavigate();

  if (!authLoading && !user) {
    navigate('/auth?redirect=/wallet');
    return null;
  }

  const num = Number(amount);
  const isPreset = useMemo(
    () => TOPUP_PACKS.find(p => p.amount === num),
    [num]
  );
  const valid = Number.isFinite(num) && num >= MIN && num <= MAX;

  // Suggest the next pack with a bonus
  const nextPack = useMemo(() => {
    if (!Number.isFinite(num)) return null;
    return TOPUP_PACKS.find(p => p.amount > num) || null;
  }, [num]);

  const startTopup = async (value: number) => {
    if (!user) return;
    if (!Number.isFinite(value) || value < MIN) {
      toast.error(`Minimum top-up is ₹${MIN}`);
      return;
    }
    if (value > MAX) {
      toast.error(`Maximum top-up is ₹${MAX}`);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('wallet-topup-initiate', {
        body: { amount: value, firstname: user.user_metadata?.first_name || 'Customer' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <Header />

      {/* Top bar */}
      <div className="bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 grid place-items-center rounded-full border bg-background hover:bg-muted"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif text-lg font-bold">MG Wallet</h1>
          <button
            onClick={refresh}
            className="ml-auto h-9 w-9 grid place-items-center rounded-full hover:bg-muted"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Available balance card */}
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-xs tracking-[0.18em] text-muted-foreground font-medium">
              AVAILABLE BALANCE
            </p>
            <div className="mt-2 flex items-center justify-center gap-1">
              <WalletIcon className="h-6 w-6 text-primary" />
              <span className="text-4xl font-bold font-serif tracking-tight">
                ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Use at checkout • Never expires
            </p>
          </CardContent>
        </Card>

        {/* Bonus promo banner — Zepto style, combined */}
        <div className="relative overflow-hidden rounded-2xl px-4 py-3.5 bg-gradient-to-r from-primary/15 via-accent/20 to-primary/10 border border-primary/25">
          <Sparkles className="absolute -top-1 -right-1 h-8 w-8 text-primary/20" />
          <Sparkles className="absolute bottom-1 left-1/3 h-4 w-4 text-primary/15" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl sm:text-3xl font-black font-serif text-primary leading-none">
                2.5%
              </span>
              <span className="text-[11px] font-extrabold leading-tight text-primary">
                EXTRA<br />CASH
              </span>
            </div>
            <p className="text-sm text-foreground/80 font-medium">
              on adding{' '}
              <span className="font-bold text-foreground">₹1,000</span>,{' '}
              <span className="font-bold text-foreground">₹2,000</span> or{' '}
              <span className="font-bold text-foreground">₹5,000</span> to MG Wallet
            </p>
          </div>
        </div>

        {/* Add money card */}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Amount input */}
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">
                Add amount <span className="text-destructive">*</span>
              </label>
              <div className="mt-1 flex items-center gap-2 h-12 px-3 rounded-xl border-2 border-input bg-secondary/40 focus-within:border-primary transition-colors">
                <span className="text-lg font-semibold text-muted-foreground">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                  className="flex-1 bg-transparent outline-none text-lg font-semibold"
                  placeholder="0"
                />
              </div>
              {isPreset && isPreset.bonus > 0 ? (
                <div className="mt-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-3 py-2">
                  🎉 You'll get ₹{isPreset.bonus} extra cash on this top-up
                </div>
              ) : nextPack ? (
                <div className="mt-2 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-medium px-3 py-2">
                  Add ₹{nextPack.amount - num} more to get additional ₹{nextPack.bonus} extra cash
                </div>
              ) : null}
            </div>

            {/* Preset chips */}
            <div className="grid grid-cols-4 gap-2">
              {TOPUP_PACKS.map(pack => {
                const selected = num === pack.amount;
                return (
                  <button
                    key={pack.amount}
                    type="button"
                    onClick={() => setAmount(String(pack.amount))}
                    className={`relative rounded-xl border-2 py-2.5 px-1 text-center transition-all ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-input bg-background hover:border-primary/40'
                    }`}
                  >
                    <div className="text-sm font-bold">{pack.amount}</div>
                    {pack.bonus > 0 && (
                      <div className="mt-1 text-[10px] font-semibold rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-1 py-0.5">
                        ₹{pack.bonus} extra
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            <Button
              onClick={() => startTopup(num)}
              disabled={!valid || submitting}
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add Balance'}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Min ₹{MIN} • Max ₹{MAX.toLocaleString('en-IN')} • Bonus on preset packs ₹1,000+ only
            </p>
          </CardContent>
        </Card>

        {/* Info accordions */}
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <button
            onClick={() => setShowHow(s => !s)}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/40"
          >
            <Info size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">How it works</span>
            <ChevronDown
              size={18}
              className={`text-muted-foreground transition-transform ${showHow ? 'rotate-180' : ''}`}
            />
          </button>
          {showHow && (
            <div className="px-4 pb-4 text-xs text-muted-foreground space-y-2 border-t">
              <p className="pt-3">• Add money from any UPI, card, or netbanking via secure PayU gateway.</p>
              <p>• Bonus cash is added instantly along with your top-up amount.</p>
              <p>• Use wallet balance fully or partially at checkout.</p>
              <p>• Refunds can be credited back to your wallet instantly when eligible.</p>
            </div>
          )}
          <div className="border-t" />
          <button
            onClick={() => setShowFaq(s => !s)}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/40"
          >
            <HelpCircle size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">FAQs</span>
            <ChevronDown
              size={18}
              className={`text-muted-foreground transition-transform ${showFaq ? 'rotate-180' : ''}`}
            />
          </button>
          {showFaq && (
            <div className="px-4 pb-4 text-xs text-muted-foreground space-y-3 border-t">
              <div className="pt-3">
                <p className="font-semibold text-foreground">Does the balance expire?</p>
                <p>No, your wallet balance never expires.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Can I withdraw the wallet balance?</p>
                <p>Wallet balance can only be used for purchases on MUFFIGOUT and is non-refundable to bank.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Will I get bonus on custom amounts?</p>
                <p>Bonus cash is available only on preset packs ₹1,000 (+₹25), ₹2,000 (+₹50), and ₹5,000 (+₹125).</p>
              </div>
            </div>
          )}
        </Card>

        {/* Transactions */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-base font-bold">Transactions</h2>
            {transactions.length > 0 && (
              <span className="text-[11px] text-muted-foreground">Last {transactions.length}</span>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No transactions yet. Add money to your wallet to get started.
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl divide-y">
              {transactions.map(tx => {
                const credit = tx.amount > 0;
                return (
                  <div key={tx.id} className="p-3 flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full grid place-items-center ${
                        credit
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-500/15 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {credit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">
                        {tx.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          credit ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {credit ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
