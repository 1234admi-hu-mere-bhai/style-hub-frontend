// Pincode-based delivery zone mapping for India
// Zone classification based on pincode prefix

interface DeliveryInfo {
  available: boolean;
  zone: string;
  estimatedDays: string;
  codAvailable: boolean;
}

// West Bengal pincodes (local)
const LOCAL_PREFIXES = ['71', '72', '73', '74'];

// Metro city pincode prefixes
const METRO_PREFIXES = [
  '11', // Delhi
  '40', // Mumbai
  '56', '57', // Bangalore
  '60', // Chennai
  '50', // Hyderabad
  '70', // Kolkata
  '41', // Pune
  '38', // Ahmedabad
  '30', // Jaipur
  '22', '23', // Lucknow
];

// Remote/difficult area prefixes (NE India, J&K, islands, etc.)
const REMOTE_PREFIXES = [
  '79', // Arunachal Pradesh, Manipur, Mizoram, Nagaland, Tripura
  '78', // Assam
  '76', // Meghalaya
  '73', // Parts of remote WB (overlap handled by local check)
  '19', // J&K, Ladakh
  '18', // J&K
  '17', // Himachal (some remote)
  '74', // Andaman & Nicobar (744xxx)
  '68', // Lakshadweep (682xxx - overlap)
];

export const checkPincodeDelivery = (pincode: string): DeliveryInfo => {
  const cleaned = pincode.replace(/\s/g, '');

  if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) {
    return { available: false, zone: '', estimatedDays: '', codAvailable: false };
  }

  const prefix2 = cleaned.substring(0, 2);
  const prefix3 = cleaned.substring(0, 3);

  // Check local (West Bengal - Purba Bardhaman area)
  if (LOCAL_PREFIXES.includes(prefix2)) {
    return {
      available: true,
      zone: 'Local (West Bengal)',
      estimatedDays: '3–5',
      codAvailable: true,
    };
  }

  // Check metro cities
  if (METRO_PREFIXES.includes(prefix2)) {
    return {
      available: true,
      zone: 'Metro City',
      estimatedDays: '7–10',
      codAvailable: true,
    };
  }

  // Check remote areas
  if (REMOTE_PREFIXES.includes(prefix2)) {
    // Andaman & Nicobar
    if (prefix3 === '744') {
      return {
        available: true,
        zone: 'Remote (Islands)',
        estimatedDays: '15–20',
        codAvailable: false,
      };
    }
    // Lakshadweep
    if (prefix3 === '682') {
      return {
        available: true,
        zone: 'Remote (Islands)',
        estimatedDays: '15–20',
        codAvailable: false,
      };
    }
    // NE India & J&K
    return {
      available: true,
      zone: 'Remote Area',
      estimatedDays: '15–20',
      codAvailable: false,
    };
  }

  // Rest of India
  return {
    available: true,
    zone: 'Rest of India',
    estimatedDays: '10–15',
    codAvailable: true,
  };
};
