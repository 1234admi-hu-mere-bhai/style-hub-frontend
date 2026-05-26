import { Link } from 'react-router-dom';
import { Wallet as WalletIcon, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';

const WalletHomeCard = () => {
  const { user } = useAuth();
  const { balance, loading } = useWallet();

  return (
    <section className="px-3 lg:container lg:mx-auto lg:px-4 pt-3 lg:pt-6">
      <Link
        to={user ? '/wallet' : '/auth?redirect=/wallet'}
        className="group relative block overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 hover:shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.4)] transition-shadow"
      >
        <div className="flex items-center gap-3 p-3 lg:p-4">
          {/* Icon badge */}
          <div className="relative shrink-0 h-12 w-12 lg:h-14 lg:w-14 rounded-xl grid place-items-center bg-primary/20 text-primary">
            <WalletIcon className="h-6 w-6 lg:h-7 lg:w-7" />
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full grid place-items-center bg-accent text-accent-foreground">
              <Sparkles className="h-3 w-3" />
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              MG Wallet
            </p>
            {user ? (
              <p className="text-base lg:text-lg font-bold font-serif leading-tight">
                ₹{loading ? '—' : balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  available
                </span>
              </p>
            ) : (
              <p className="text-base lg:text-lg font-bold font-serif leading-tight">
                Add money & save more
              </p>
            )}
            <p className="text-[11px] text-muted-foreground truncate">
              Get up to ₹125 extra cash on top-ups
            </p>
          </div>

          {/* CTA */}
          <div className="shrink-0 flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold group-hover:gap-2 transition-all">
            {user ? 'Add Money' : 'Explore'}
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Link>
    </section>
  );
};

export default WalletHomeCard;
