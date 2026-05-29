// Centralized option lists for product attribute fields.
// Used by AdminProducts (dropdowns) and discovery filters (chips).

export const FIT_OPTIONS = ['Oversized', 'Regular', 'Slim'] as const;

export const FABRIC_OPTIONS = [
  'Cotton',
  'Cotton Blend',
  'Linen',
  'Linen Blend',
  'Polyester',
  'Rayon',
  'Denim',
  'Wool',
  'Fleece',
  'Terry',
] as const;

export const OCCASION_OPTIONS = [
  'Casual',
  'Formal',
  'Party',
  'Office',
  'Festive',
  'Sports',
  'Vacation',
  'Loungewear',
] as const;

export const COLOR_FAMILY_OPTIONS = [
  'Black',
  'White',
  'Blue',
  'Red',
  'Green',
  'Yellow',
  'Pink',
  'Grey',
  'Brown',
  'Beige',
  'Orange',
  'Purple',
  'Multi',
] as const;

export const SLEEVE_TYPE_OPTIONS = [
  'Full Sleeve',
  'Half Sleeve',
  '3/4 Sleeve',
  'Sleeveless',
  'Roll-up Sleeve',
] as const;

export const NECK_TYPE_OPTIONS = [
  'Round Neck',
  'V-Neck',
  'Polo Collar',
  'Hooded',
  'Mandarin Collar',
  'Shirt Collar',
  'Henley',
  'Turtle Neck',
] as const;

// Collection is admin-defined free text. We surface whatever distinct values
// exist on currently visible products as filter chips.

export interface PriceChip {
  label: string;
  min: number;
  max: number; // inclusive upper bound
}

export const PRICE_CHIPS: PriceChip[] = [
  { label: 'Under ₹499', min: 0, max: 499 },
  { label: '₹500 – ₹999', min: 500, max: 999 },
  { label: '₹1000 – ₹1999', min: 1000, max: 1999 },
  { label: '₹2000 – ₹4999', min: 2000, max: 4999 },
  { label: '₹5000 & above', min: 5000, max: Number.MAX_SAFE_INTEGER },
];
