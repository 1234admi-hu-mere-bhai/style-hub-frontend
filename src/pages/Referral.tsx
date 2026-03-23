import { useState } from 'react';
import { Copy, Gift, Users, IndianRupee, Share2, CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/hooks/useReferrals';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Referral = () => {
  const { user } = useAuth();
  const { myCode, loading, createReferralCode, successfulReferrals, totalEarnings, referrals } = useReferrals(user?.id);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const code = await createReferralCode();
    if (code) toast.success('Referral code generated!');
    else toast.error('Failed to generate code. Try again.');
    setGenerating(false);
  };

  const handleCopy = () => {
    if (!myCode) return;
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!myCode) return;
    const text = `Hey! Use my referral code ${myCode} on Muffigout Apparel Hub and get ₹100 off your first order! Shop now: ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({ title: 'Muffigout Referral', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Share message copied to clipboard!');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <Gift className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="font-serif text-3xl font-bold mb-4">Refer & Earn</h1>
          <p className="text-muted-foreground mb-8">Sign in to get your referral code and start earning rewards!</p>
          <Button asChild size="lg"><Link to="/auth">Sign In</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 lg:py-20 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">Refer a Friend, Both Get ₹100 Off!</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Share your unique code with friends. When they make their first purchase, you both get ₹100 off your next order.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{successfulReferrals}</p>
            <p className="text-xs text-muted-foreground">Friends Referred</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <IndianRupee className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">₹{totalEarnings}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Gift className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{referrals.filter(r => r.status === 'pending').length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 lg:p-8 mb-10">
          <h2 className="font-semibold text-lg mb-4 text-center">Your Referral Code</h2>
          {myCode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <div className="bg-background border-2 border-dashed border-primary rounded-lg px-6 py-3">
                  <span className="text-2xl font-bold tracking-widest text-primary">{myCode}</span>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground mb-4 text-sm">Generate your unique referral code to start earning rewards</p>
              <Button onClick={handleGenerate} disabled={generating || loading}>
                {generating ? 'Generating...' : 'Generate My Code'}
              </Button>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h2 className="font-serif text-xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Share Your Code', desc: 'Copy your referral code and share it with friends via WhatsApp, social media, or in person.' },
              { step: '2', title: 'Friend Shops', desc: 'Your friend enters your code at checkout and gets ₹100 off their first order.' },
              { step: '3', title: 'You Earn Too', desc: 'Once their order is placed, you get ₹100 off your next purchase. Win-win!' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-secondary/30 rounded-xl p-5 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground mb-2">Terms & Conditions</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Referral discount of ₹100 is applicable on orders above ₹499.</li>
            <li>Each referral code can be used once per new customer.</li>
            <li>Referral rewards cannot be combined with other coupons or offers.</li>
            <li>Muffigout Apparel Hub reserves the right to modify or cancel the referral program at any time.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Referral;
