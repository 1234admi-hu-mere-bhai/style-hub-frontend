import { useState, useEffect, useCallback } from 'react';

type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

interface CurrencyConfig {
  symbol: string;
  code: Currency;
  locale: string;
  rate: number; // Exchange rate from INR
}

const currencyConfigs: Record<Currency, CurrencyConfig> = {
  INR: { symbol: '₹', code: 'INR', locale: 'en-IN', rate: 1 },
  USD: { symbol: '$', code: 'USD', locale: 'en-US', rate: 0.012 },
  EUR: { symbol: '€', code: 'EUR', locale: 'de-DE', rate: 0.011 },
  GBP: { symbol: '£', code: 'GBP', locale: 'en-GB', rate: 0.0095 },
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('currency') as Currency) || 'INR';
    }
    return 'INR';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('currency') as Currency;
      if (stored && stored !== currency) {
        setCurrency(stored);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      const stored = localStorage.getItem('currency') as Currency;
      if (stored && stored !== currency) {
        setCurrency(stored);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currency]);

  const formatPrice = useCallback((priceInINR: number): string => {
    const config = currencyConfigs[currency];
    const convertedPrice = priceInINR * config.rate;
    
    // Format with appropriate decimals
    if (currency === 'INR') {
      return `${config.symbol}${Math.round(convertedPrice).toLocaleString(config.locale)}`;
    }
    
    return `${config.symbol}${convertedPrice.toLocaleString(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [currency]);

  const convertPrice = useCallback((priceInINR: number): number => {
    const config = currencyConfigs[currency];
    return priceInINR * config.rate;
  }, [currency]);

  return {
    currency,
    currencySymbol: currencyConfigs[currency].symbol,
    formatPrice,
    convertPrice,
  };
};

export default useCurrency;
