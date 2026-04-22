// Cash on Delivery eligibility & pricing.
// Business rules (locked):
//   - Order subtotal (post-coupon, pre-shipping/COD) must be ≤ COD_MAX_ORDER
//   - COD fee: COD_FEE flat
//   - COD not available on Flash Sale items
//   - COD not available on remote pincodes (Islands, NE India, J&K — see pincodeChecker)
//   - COD not available for Buy Now of the ₹1 Test Product (already excluded by limit)

import { checkPincodeDelivery } from './pincodeChecker';

export const COD_MAX_ORDER = 1000;
export const COD_FEE = 40;

export interface CodEligibility {
  eligible: boolean;
  reason?: string;
}

export const checkCodEligibility = (params: {
  postCouponSubtotal: number;
  hasFlashSaleItems: boolean;
  pincode?: string;
}): CodEligibility => {
  const { postCouponSubtotal, hasFlashSaleItems, pincode } = params;

  if (hasFlashSaleItems) {
    return { eligible: false, reason: 'Cash on Delivery is not available on Flash Sale items.' };
  }

  if (postCouponSubtotal > COD_MAX_ORDER) {
    return {
      eligible: false,
      reason: `Cash on Delivery is available only on orders up to ₹${COD_MAX_ORDER}.`,
    };
  }

  if (pincode && /^\d{6}$/.test(pincode)) {
    const info = checkPincodeDelivery(pincode);
    if (!info.codAvailable) {
      return {
        eligible: false,
        reason: `Cash on Delivery is not available for ${info.zone || 'this pincode'}.`,
      };
    }
  }

  return { eligible: true };
};
