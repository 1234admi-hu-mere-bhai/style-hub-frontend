// Centralized shipping calculator.
// Business rules (locked):
//   - West Bengal (intra-state): ₹20 handling charge, 7-day delivery
//   - Outside West Bengal: ₹99 standard shipping, 10-day delivery
//   - Free shipping (FREE_SHIPPING_THRESHOLD ≥ ₹999) overrides charges except WB handling
//   - ₹1 test items always ship free
//
// State is matched case-insensitively. Pincodes starting with 70, 71, 72, 73, 74
// are treated as West Bengal when the state field is missing/blank.

export const FREE_SHIPPING_THRESHOLD = 999;
export const WB_HANDLING_CHARGE = 20;
export const STANDARD_SHIPPING_FEE = 99;
export const WB_DELIVERY_DAYS = 7;
export const NATIONAL_DELIVERY_DAYS = 10;

const WB_PINCODE_PREFIXES = ['70', '71', '72', '73', '74'];

export interface ShippingQuote {
  cost: number;
  zone: 'west_bengal' | 'national';
  deliveryDays: number;
  isFree: boolean;
  label: string;
}

export const isWestBengal = (state?: string, pincode?: string): boolean => {
  if (state && state.trim().toLowerCase() === 'west bengal') return true;
  if (pincode && /^\d{6}$/.test(pincode)) {
    return WB_PINCODE_PREFIXES.includes(pincode.substring(0, 2));
  }
  return false;
};

export const calculateShipping = (params: {
  subtotal: number;
  state?: string;
  pincode?: string;
  hasTestItem?: boolean;
}): ShippingQuote => {
  const { subtotal, state, pincode, hasTestItem } = params;
  const wb = isWestBengal(state, pincode);
  const zone: ShippingQuote['zone'] = wb ? 'west_bengal' : 'national';
  const deliveryDays = wb ? WB_DELIVERY_DAYS : NATIONAL_DELIVERY_DAYS;

  // ₹1 test items always free
  if (hasTestItem) {
    return { cost: 0, zone, deliveryDays, isFree: true, label: 'FREE' };
  }

  // West Bengal: flat ₹20 handling, no free shipping override
  if (wb) {
    return {
      cost: WB_HANDLING_CHARGE,
      zone,
      deliveryDays,
      isFree: false,
      label: `+ ₹${WB_HANDLING_CHARGE} handling`,
    };
  }

  // Outside WB: free above threshold, else ₹99
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return { cost: 0, zone, deliveryDays, isFree: true, label: 'FREE' };
  }
  return {
    cost: STANDARD_SHIPPING_FEE,
    zone,
    deliveryDays,
    isFree: false,
    label: `+ ₹${STANDARD_SHIPPING_FEE}`,
  };
};
