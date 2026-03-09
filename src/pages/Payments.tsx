import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Plus, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'refund' | 'payment';
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
  orderId: string;
  description: string;
}

interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'bank';
  label: string;
  details: string;
  isDefault: boolean;
}

const Payments = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ ifsc: '', accountNumber: '', confirmAccount: '', holderName: '' });
  const [bankFormErrors, setBankFormErrors] = useState<Record<string, string>>({});
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [newMethod, setNewMethod] = useState({ type: 'upi', label: '', details: '' });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Load transactions from orders with refund status
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      try {
        // Load orders that have been cancelled/refunded
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['cancelled', 'refunded', 'delivered'])
          .order('updated_at', { ascending: false });

        if (orders) {
          const txns: Transaction[] = orders
            .filter(order => order.status === 'cancelled' || order.status === 'refunded')
            .map(order => ({
              id: order.id,
              date: order.updated_at,
              amount: order.total,
              type: 'refund' as const,
              status: order.status === 'refunded' ? 'completed' as const : 'pending' as const,
              transactionId: order.payment_id || `REF${order.order_number}`,
              orderId: order.order_number,
              description: `A total of Rs. ${order.total} has been initiated to your original payment source - Card / Bank Account. It should reflect within 5-8 working days. You can track the status of this transfer with the transaction Id : ${order.payment_id || order.order_number} with your card/bank.`,
            }));
          setTransactions(txns);
        }

        // Load saved payment methods from localStorage (since we don't have a table for this)
        const savedMethods = localStorage.getItem(`payment_methods_${user.id}`);
        if (savedMethods) {
          setPaymentMethods(JSON.parse(savedMethods));
        }
      } catch (error) {
        console.error('Failed to load payment data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const savePaymentMethods = (methods: PaymentMethod[]) => {
    if (user) {
      localStorage.setItem(`payment_methods_${user.id}`, JSON.stringify(methods));
    }
    setPaymentMethods(methods);
  };

  const handleAddPaymentMethod = () => {
    if (!newMethod.label.trim() || !newMethod.details.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    const method: PaymentMethod = {
      id: Date.now().toString(),
      type: newMethod.type as 'upi' | 'card' | 'bank',
      label: newMethod.label,
      details: newMethod.details,
      isDefault: paymentMethods.length === 0,
    };

    savePaymentMethods([...paymentMethods, method]);
    setIsAddMethodOpen(false);
    setNewMethod({ type: 'upi', label: '', details: '' });
    toast.success('Payment method added');
  };

  const handleAddBankAccount = () => {
    const errors: Record<string, string> = {};
    if (!bankForm.ifsc.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifsc.toUpperCase())) {
      errors.ifsc = 'Enter a valid 11-character IFSC code';
    }
    if (!bankForm.accountNumber.trim() || bankForm.accountNumber.length < 8) {
      errors.accountNumber = 'Enter a valid account number';
    }
    if (bankForm.accountNumber !== bankForm.confirmAccount) {
      errors.confirmAccount = 'Account numbers do not match';
    }
    if (!bankForm.holderName.trim()) {
      errors.holderName = 'Enter the account holder name';
    }
    if (!privacyAgreed) {
      errors.privacy = 'Please agree to the Privacy Policy';
    }
    setBankFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const lastFour = bankForm.accountNumber.slice(-4);
    const method: PaymentMethod = {
      id: Date.now().toString(),
      type: 'bank',
      label: `${bankForm.holderName} (${bankForm.ifsc.toUpperCase()})`,
      details: `A/C ending ****${lastFour}`,
      isDefault: paymentMethods.length === 0,
    };

    savePaymentMethods([...paymentMethods, method]);
    setIsBankFormOpen(false);
    setBankForm({ ifsc: '', accountNumber: '', confirmAccount: '', holderName: '' });
    setPrivacyAgreed(false);
    setBankFormErrors({});
    toast.success('Bank account added successfully');
  };

  const handleDeleteMethod = (id: string) => {
    const updated = paymentMethods.filter(m => m.id !== id);
    if (updated.length > 0 && !updated.some(m => m.isDefault)) {
      updated[0].isDefault = true;
    }
    savePaymentMethods(updated);
    toast.success('Payment method removed');
  };

  const handleSetDefault = (id: string) => {
    const updated = paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === id,
    }));
    savePaymentMethods(updated);
    toast.success('Default payment method updated');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'upi':
        return <Wallet className="h-5 w-5 text-primary" />;
      case 'card':
        return <CreditCard className="h-5 w-5 text-primary" />;
      case 'bank':
        return <Wallet className="h-5 w-5 text-primary" />;
      default:
        return <CreditCard className="h-5 w-5 text-primary" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-2xl font-bold">MY PAYMENTS</h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="transactions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="methods" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Payment Modes
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <CreditCard size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No transactions yet</h3>
                <p className="text-muted-foreground">
                  Your refund and payment history will appear here
                </p>
              </div>
            ) : (
              transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-card p-4 rounded-lg border border-border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{formatDate(txn.date)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      txn.status === 'completed' 
                        ? 'bg-success/10 text-success' 
                        : txn.status === 'pending'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {txn.description}
                  </p>
                  <button
                    onClick={() => setSelectedTransaction(txn)}
                    className="text-sm text-primary font-medium mt-2 hover:underline"
                  >
                    VIEW MORE
                  </button>
                </div>
              ))
            )}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="methods" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsAddMethodOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            {paymentMethods.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <Wallet size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No saved payment methods</h3>
                <p className="text-muted-foreground mb-4">
                  Add a payment method for faster checkout
                </p>
              </div>
            ) : (
              paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`bg-card p-4 rounded-lg border ${
                    method.isDefault ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getMethodIcon(method.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.label}</span>
                        {method.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.details}</p>
                    </div>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMethod(method.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Bank & UPI Section */}
            <div className="mt-6">
              <h3 className="font-semibold mb-4">Quick Add</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setNewMethod({ type: 'upi', label: '', details: '' });
                    setIsAddMethodOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <Wallet className="h-5 w-5 text-primary" />
                  <span>Bank & UPI Details</span>
                </button>
                <button
                  onClick={() => {
                    setNewMethod({ type: 'card', label: '', details: '' });
                    setIsAddMethodOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Card Details</span>
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Transaction Detail Modal */}
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{selectedTransaction && formatDate(selectedTransaction.date)}</span>
              </DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedTransaction.description}</p>
                <div className="pt-4 border-t border-border">
                  <p className="font-medium">
                    {selectedTransaction.type === 'refund' ? 'Refund' : 'Payment'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    #{selectedTransaction.orderId} - Rs. {selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setSelectedTransaction(null)}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Payment Method Modal */}
        <Dialog open={isAddMethodOpen} onOpenChange={setIsAddMethodOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Method Type</Label>
                <div className="flex gap-2">
                  {['upi', 'card', 'bank'].map((type) => (
                    <Button
                      key={type}
                      variant={newMethod.type === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewMethod({ ...newMethod, type })}
                    >
                      {type.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodLabel">Label</Label>
                <Input
                  id="methodLabel"
                  placeholder={
                    newMethod.type === 'upi'
                      ? 'e.g., PhonePe, GPay'
                      : newMethod.type === 'card'
                      ? 'e.g., HDFC Visa'
                      : 'e.g., SBI Account'
                  }
                  value={newMethod.label}
                  onChange={(e) => setNewMethod({ ...newMethod, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodDetails">
                  {newMethod.type === 'upi'
                    ? 'UPI ID'
                    : newMethod.type === 'card'
                    ? 'Last 4 Digits'
                    : 'Account Number (last 4 digits)'}
                </Label>
                <Input
                  id="methodDetails"
                  placeholder={
                    newMethod.type === 'upi'
                      ? 'user@upi'
                      : 'XXXX'
                  }
                  value={newMethod.details}
                  onChange={(e) => setNewMethod({ ...newMethod, details: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsAddMethodOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddPaymentMethod}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default Payments;
