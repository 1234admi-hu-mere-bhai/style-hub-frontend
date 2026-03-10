import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Globe, IndianRupee, Bell } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';

const PushSettings = () => {
  const { supported, isSubscribed, permission, subscribe, unsubscribe, loading } = useWebPush();
  if (!supported) return null;
  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h2 className="font-semibold text-xl mb-6 flex items-center gap-2">
        <Bell size={20} />
        Push Notifications
      </h2>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="push-notif" className="text-base">
            {permission === 'denied' ? 'Notifications Blocked' : 'Push Notifications'}
          </Label>
          <p className="text-sm text-muted-foreground">
            {permission === 'denied'
              ? 'Please enable notifications in your browser settings'
              : isSubscribed
                ? 'You will receive push notifications for sales & updates'
                : 'Get notified about flash sales, order updates & offers'}
          </p>
        </div>
        <Switch
          id="push-notif"
          checked={isSubscribed}
          disabled={loading || permission === 'denied'}
          onCheckedChange={(checked) => { if (checked) subscribe(); else unsubscribe(); }}
        />
      </div>
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });
  
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('currency') || 'INR';
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem('language', value);
    toast.success(`Language changed to ${getLanguageLabel(value)}`);
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    localStorage.setItem('currency', value);
    toast.success(`Currency changed to ${value}`);
  };

  const getLanguageLabel = (code: string) => {
    const languages: Record<string, string> = {
      en: 'English',
      hi: 'हिंदी (Hindi)',
      mr: 'मराठी (Marathi)',
      ta: 'தமிழ் (Tamil)',
    };
    return languages[code] || code;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Profile
        </Button>

        <h1 className="font-serif text-3xl font-bold mb-8">Settings</h1>

        <div className="max-w-2xl space-y-6">
          {/* Appearance */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="font-semibold text-xl mb-6 flex items-center gap-2">
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              Appearance
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={(checked) => {
                  setDarkMode(checked);
                  toast.success(`${checked ? 'Dark' : 'Light'} mode enabled`);
                }}
              />
            </div>
          </div>

          {/* Push Notifications */}
          <PushSettings />

          {/* Language */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="font-semibold text-xl mb-6 flex items-center gap-2">
              <Globe size={20} />
              Language
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="language" className="text-base">Display Language</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred language
                </p>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                  <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Currency */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="font-semibold text-xl mb-6 flex items-center gap-2">
              <IndianRupee size={20} />
              Currency
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="currency" className="text-base">Display Currency</Label>
                <p className="text-sm text-muted-foreground">
                  Choose how prices are displayed
                </p>
              </div>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                  <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                  <SelectItem value="GBP">£ GBP (British Pound)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Note: All transactions are processed in INR. Currency display is for reference only.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
