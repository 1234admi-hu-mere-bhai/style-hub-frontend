import { Smartphone, CreditCard, Building2, Wallet, ChevronRight } from 'lucide-react';

export type PaymentSubMethod = {
  id: string;
  label: string;
  pg: string;
  bankcode?: string;
  category: 'upi' | 'card' | 'netbanking' | 'wallet';
};

// Top UPI apps shown as branded buttons. Anything else falls under
// "Other UPI apps" which opens Android's native UPI app chooser via PayU.
export const UPI_APPS: PaymentSubMethod[] = [
  { id: 'gpay', label: 'Google Pay', pg: 'UPI', bankcode: 'TEZ', category: 'upi' },
  { id: 'phonepe', label: 'PhonePe', pg: 'UPI', bankcode: 'PHONEPE', category: 'upi' },
  { id: 'paytm-upi', label: 'Paytm UPI', pg: 'UPI', bankcode: 'INTENT', category: 'upi' },
  { id: 'bhim', label: 'BHIM', pg: 'UPI', bankcode: 'BHIM', category: 'upi' },
  { id: 'upi-other', label: 'Other UPI apps', pg: 'UPI', bankcode: 'UPI', category: 'upi' },
];

const WALLETS: PaymentSubMethod[] = [
  { id: 'paytm-wallet', label: 'Paytm Wallet', pg: 'WALLET', bankcode: 'PAYTM', category: 'wallet' },
  { id: 'mobikwik', label: 'MobiKwik', pg: 'WALLET', bankcode: 'MOBIKWIK', category: 'wallet' },
  { id: 'amazonpay', label: 'Amazon Pay', pg: 'WALLET', bankcode: 'AMZNPAYW', category: 'wallet' },
];

interface Props {
  selectedId: string | null;
  onSelect: (method: PaymentSubMethod) => void;
}

const Tile = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full min-h-[60px] sm:min-h-[56px] flex items-center justify-between gap-2 p-3.5 sm:p-3 rounded-xl border-2 transition-all text-left active:scale-[0.98] ${
      active
        ? 'border-primary bg-primary/5'
        : 'border-border hover:border-muted-foreground/40 bg-background'
    }`}
  >
    {children}
    <ChevronRight size={18} className={`shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
  </button>
);

const Letter = ({ char, color }: { char: string; color: string }) => (
  <div
    className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-sm shrink-0"
    style={{ background: color }}
  >
    {char}
  </div>
);

export const PaymentMethodPicker = ({ selectedId, onSelect }: Props) => {
  return (
    <div className="space-y-5">
      {/* UPI Section */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Smartphone size={14} className="text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            UPI Apps
          </h4>
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded">RECOMMENDED</span>
        </div>
        <div className="space-y-2">
          {UPI_APPS.map((app) => {
            const colors: Record<string, string> = {
              gpay: 'linear-gradient(135deg, #4285F4, #34A853)',
              phonepe: '#5F259F',
              'paytm-upi': '#00BAF2',
              bhim: '#F7941D',
              'upi-other': 'hsl(var(--muted-foreground))',
            };
            const initials: Record<string, string> = {
              gpay: 'G', phonepe: 'Pe', 'paytm-upi': 'P', bhim: 'B', 'upi-other': '⋯',
            };
            return (
              <Tile key={app.id} active={selectedId === app.id} onClick={() => onSelect(app)}>
                <div className="flex items-center gap-3">
                  <Letter char={initials[app.id]} color={colors[app.id]} />
                  <div>
                    <p className="font-semibold text-sm">{app.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {app.id === 'upi-other' ? 'Choose from any installed UPI app' : 'Pay via UPI app'}
                    </p>
                  </div>
                </div>
              </Tile>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <CreditCard size={14} className="text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cards
          </h4>
        </div>
        <Tile
          active={selectedId === 'card'}
          onClick={() => onSelect({ id: 'card', label: 'Credit / Debit Card', pg: 'CC', category: 'card' })}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Credit / Debit Card</p>
              <p className="text-[11px] text-muted-foreground">Visa, Mastercard, RuPay, Amex</p>
            </div>
          </div>
        </Tile>
      </div>

      {/* Net Banking */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Building2 size={14} className="text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Net Banking
          </h4>
        </div>
        <Tile
          active={selectedId === 'netbanking'}
          onClick={() => onSelect({ id: 'netbanking', label: 'Net Banking', pg: 'NB', category: 'netbanking' })}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">All Indian Banks</p>
              <p className="text-[11px] text-muted-foreground">SBI, HDFC, ICICI, Axis, Kotak & more</p>
            </div>
          </div>
        </Tile>
      </div>

      {/* Wallets */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Wallet size={14} className="text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Wallets
          </h4>
        </div>
        <div className="space-y-2">
          {WALLETS.map((w) => {
            const colors: Record<string, string> = {
              'paytm-wallet': '#00BAF2',
              mobikwik: '#2A2A72',
              amazonpay: '#FF9900',
            };
            const initials: Record<string, string> = {
              'paytm-wallet': 'P', mobikwik: 'M', amazonpay: 'a',
            };
            return (
              <Tile key={w.id} active={selectedId === w.id} onClick={() => onSelect(w)}>
                <div className="flex items-center gap-3">
                  <Letter char={initials[w.id]} color={colors[w.id]} />
                  <div>
                    <p className="font-semibold text-sm">{w.label}</p>
                    <p className="text-[11px] text-muted-foreground">Pay from wallet balance</p>
                  </div>
                </div>
              </Tile>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center pt-1">
        🔒 Payments processed securely via PayU
      </p>
    </div>
  );
};
