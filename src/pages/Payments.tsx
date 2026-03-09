import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Plus, Trash2, Loader2, ShieldCheck, Landmark, Smartphone, Pencil } from 'lucide-react';
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
  type: 'refund' | 'replacement' | 'payment';
  status: 'completed' | 'pending' | 'processing' | 'failed';
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
  const [txnFilter, setTxnFilter] = useState<'all' | 'refund' | 'replacement'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const [isUpiFormOpen, setIsUpiFormOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ ifsc: '', accountNumber: '', confirmAccount: '', holderName: '' });
  const [upiForm, setUpiForm] = useState({ upiId: '', name: '' });
  const [bankFormErrors, setBankFormErrors] = useState<Record<string, string>>({});
  const [upiFormErrors, setUpiFormErrors] = useState<Record<string, string>>({});
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
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
          .in('status', ['cancelled', 'refunded', 'replacement_requested', 'replacement_shipped', 'replacement_delivered'])
          .order('updated_at', { ascending: false });

        if (orders) {
          const txns: Transaction[] = orders.map(order => {
            const isReplacement = order.status.startsWith('replacement');
            if (isReplacement) {
              const statusMap: Record<string, Transaction['status']> = {
                replacement_requested: 'pending',
                replacement_shipped: 'processing',
                replacement_delivered: 'completed',
              };
              return {
                id: order.id,
                date: order.updated_at,
                amount: order.total,
                type: 'replacement' as const,
                status: statusMap[order.status] || 'pending',
                transactionId: order.payment_id || `RPL${order.order_number}`,
                orderId: order.order_number,
                description: `A replacement request for Order #${order.order_number} worth Rs. ${order.total} has been ${order.status === 'replacement_requested' ? 'initiated' : order.status === 'replacement_shipped' ? 'shipped' : 'delivered'}. ${order.status === 'replacement_requested' ? 'Our team is reviewing your request and will process it within 2-3 working days.' : order.status === 'replacement_shipped' ? 'Your replacement is on the way and should arrive within 3-5 working days.' : 'Your replacement has been successfully delivered.'}`,
              };
            }
            return {
              id: order.id,
              date: order.updated_at,
              amount: order.total,
              type: 'refund' as const,
              status: order.status === 'refunded' ? 'completed' as const : 'pending' as const,
              transactionId: order.payment_id || `REF${order.order_number}`,
              orderId: order.order_number,
              description: `A total of Rs. ${order.total} has been initiated to your original payment source - Card / Bank Account. It should reflect within 5-8 working days. You can track the status of this transfer with the transaction Id : ${order.payment_id || order.order_number} with your card/bank.`,
            };
          });
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

    if (editingMethod) {
      const updated = paymentMethods.map(m =>
        m.id === editingMethod.id
          ? { ...m, label: `${bankForm.holderName} (${bankForm.ifsc.toUpperCase()})`, details: `A/C ending ****${lastFour}` }
          : m
      );
      savePaymentMethods(updated);
      toast.success('Bank account updated successfully');
    } else {
      const method: PaymentMethod = {
        id: Date.now().toString(),
        type: 'bank',
        label: `${bankForm.holderName} (${bankForm.ifsc.toUpperCase()})`,
        details: `A/C ending ****${lastFour}`,
        isDefault: paymentMethods.length === 0,
      };
      savePaymentMethods([...paymentMethods, method]);
      toast.success('Bank account added successfully');
    }

    setIsBankFormOpen(false);
    setBankForm({ ifsc: '', accountNumber: '', confirmAccount: '', holderName: '' });
    setPrivacyAgreed(false);
    setBankFormErrors({});
    setEditingMethod(null);
  };

  const handleAddUpi = () => {
    const errors: Record<string, string> = {};
    if (!upiForm.upiId.trim() || !/^[\w.-]+@[\w]+$/.test(upiForm.upiId.trim())) {
      errors.upiId = 'Enter a valid UPI ID (e.g., name@upi)';
    }
    if (!upiForm.name.trim()) {
      errors.name = 'Enter the account holder name';
    }
    setUpiFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingMethod) {
      const updated = paymentMethods.map(m =>
        m.id === editingMethod.id
          ? { ...m, label: upiForm.name, details: upiForm.upiId }
          : m
      );
      savePaymentMethods(updated);
      toast.success('UPI payment method updated');
    } else {
      const method: PaymentMethod = {
        id: Date.now().toString(),
        type: 'upi',
        label: upiForm.name,
        details: upiForm.upiId,
        isDefault: paymentMethods.length === 0,
      };
      savePaymentMethods([...paymentMethods, method]);
      toast.success('UPI payment method added');
    }

    setIsUpiFormOpen(false);
    setUpiForm({ upiId: '', name: '' });
    setUpiFormErrors({});
    setEditingMethod(null);
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    if (method.type === 'upi') {
      setUpiForm({ upiId: method.details, name: method.label });
      setUpiFormErrors({});
      setIsUpiFormOpen(true);
    } else if (method.type === 'bank') {
      // Pre-fill what we can from the saved label/details
      const ifscMatch = method.label.match(/\(([^)]+)\)/);
      setBankForm({
        ifsc: ifscMatch ? ifscMatch[1] : '',
        accountNumber: '',
        confirmAccount: '',
        holderName: method.label.replace(/\s*\([^)]*\)/, ''),
      });
      setBankFormErrors({});
      setPrivacyAgreed(false);
      setIsBankFormOpen(true);
    }
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
        return <Smartphone className="h-5 w-5 text-primary" />;
      case 'bank':
        return <Landmark className="h-5 w-5 text-primary" />;
      default:
        return <Wallet className="h-5 w-5 text-primary" />;
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
            {/* Filter Chips */}
            <div className="flex gap-2 mb-2">
              {(['all', 'refund', 'replacement'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTxnFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    txnFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'refund' ? 'Refunds' : 'Replacements'}
                </button>
              ))}
            </div>

            {(() => {
              const filtered = txnFilter === 'all'
                ? transactions
                : transactions.filter(t => t.type === txnFilter);

              return filtered.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border border-border">
                  <CreditCard size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">
                    {txnFilter === 'all' ? 'No transactions yet' : `No ${txnFilter}s yet`}
                  </h3>
                  <p className="text-muted-foreground">
                    Your {txnFilter === 'all' ? 'refund and replacement' : txnFilter} history will appear here
                  </p>
                </div>
              ) : (
                filtered.map((txn) => (
                  <div
                    key={txn.id}
                    className="bg-card p-4 rounded-lg border border-border"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatDate(txn.date)}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          txn.type === 'refund'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {txn.type === 'refund' ? 'Refund' : 'Replacement'}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        txn.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : txn.status === 'processing'
                          ? 'bg-primary/10 text-primary'
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
              );
            })()}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="methods" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsAddMethodOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Payment Method
              </Button>
            </div>

            {/* Choose Method Type Dialog */}
            <Dialog open={isAddMethodOpen} onOpenChange={setIsAddMethodOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-lg tracking-wide">ADD PAYMENT METHOD</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button
                    onClick={() => { setIsAddMethodOpen(false); setIsUpiFormOpen(true); }}
                    className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Smartphone className="h-8 w-8 text-primary" />
                    <span className="font-medium text-sm">UPI</span>
                  </button>
                  <button
                    onClick={() => { setIsAddMethodOpen(false); setIsBankFormOpen(true); }}
                    className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Landmark className="h-8 w-8 text-primary" />
                    <span className="font-medium text-sm">Bank Account</span>
                  </button>
                </div>
              </DialogContent>
            </Dialog>

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
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          method.type === 'upi'
                            ? 'bg-accent/20 text-accent-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {method.type === 'upi' ? 'UPI' : 'Bank'}
                        </span>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditMethod(method)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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

        {/* Bank Details Form — Full-screen style like reference */}
        <Dialog open={isBankFormOpen} onOpenChange={(open) => { setIsBankFormOpen(open); if (!open) setEditingMethod(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg tracking-wide">{editingMethod ? 'EDIT BANK DETAILS' : 'MY BANK DETAILS'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* IFSC Code */}
              <div className="space-y-1">
                <Label htmlFor="ifsc" className="text-sm text-primary font-medium">IFSC Code</Label>
                <Input
                  id="ifsc"
                  placeholder="e.g., SBIN0001234"
                  className="border-0 border-b-2 border-primary rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary uppercase"
                  value={bankForm.ifsc}
                  onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })}
                  maxLength={11}
                />
                {bankFormErrors.ifsc && <p className="text-xs text-destructive">{bankFormErrors.ifsc}</p>}
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <Label htmlFor="accountNumber" className="text-sm text-muted-foreground">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Account Number"
                  type="password"
                  className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                />
                {bankFormErrors.accountNumber && <p className="text-xs text-destructive">{bankFormErrors.accountNumber}</p>}
              </div>

              {/* Confirm Account Number */}
              <div className="space-y-1">
                <Label htmlFor="confirmAccount" className="text-sm text-muted-foreground">Confirm Account Number</Label>
                <Input
                  id="confirmAccount"
                  placeholder="Confirm Account Number"
                  className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  value={bankForm.confirmAccount}
                  onChange={(e) => setBankForm({ ...bankForm, confirmAccount: e.target.value.replace(/\D/g, '') })}
                />
                {bankFormErrors.confirmAccount && <p className="text-xs text-destructive">{bankFormErrors.confirmAccount}</p>}
              </div>

              {/* Account Holder's Name */}
              <div className="space-y-1">
                <Label htmlFor="holderName" className="text-sm text-muted-foreground">Account Holder's Name</Label>
                <Input
                  id="holderName"
                  placeholder="Account Holder's Name"
                  className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  value={bankForm.holderName}
                  onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                />
                {bankFormErrors.holderName && <p className="text-xs text-destructive">{bankFormErrors.holderName}</p>}
              </div>

              {/* Privacy Policy Checkbox */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="bankPrivacy"
                  checked={privacyAgreed}
                  onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
                />
                <label htmlFor="bankPrivacy" className="text-sm leading-tight">
                  By continuing, you agree with the handling of your data as per our{' '}
                  <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>
                </label>
              </div>
              {bankFormErrors.privacy && <p className="text-xs text-destructive">{bankFormErrors.privacy}</p>}

              {/* Safety Note */}
              <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Please enter the bank details carefully and don't worry, it is 100% safe!
                </p>
              </div>

              {/* Submit */}
              <Button className="w-full" onClick={handleAddBankAccount}>
                {editingMethod ? 'Update' : 'Submit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* UPI Form Dialog */}
        <Dialog open={isUpiFormOpen} onOpenChange={(open) => { setIsUpiFormOpen(open); if (!open) setEditingMethod(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg tracking-wide">{editingMethod ? 'EDIT UPI DETAILS' : 'ADD UPI DETAILS'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-1">
                <Label htmlFor="upiId" className="text-sm text-primary font-medium">UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="e.g., yourname@upi"
                  className="border-0 border-b-2 border-primary rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  value={upiForm.upiId}
                  onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                />
                {upiFormErrors.upiId && <p className="text-xs text-destructive">{upiFormErrors.upiId}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="upiName" className="text-sm text-muted-foreground">Account Holder Name</Label>
                <Input
                  id="upiName"
                  placeholder="Account Holder's Name"
                  className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  value={upiForm.name}
                  onChange={(e) => setUpiForm({ ...upiForm, name: e.target.value })}
                />
                {upiFormErrors.name && <p className="text-xs text-destructive">{upiFormErrors.name}</p>}
              </div>

              <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Your UPI details are stored securely and are 100% safe!
                </p>
              </div>

              <Button className="w-full" onClick={handleAddUpi}>
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default Payments;
