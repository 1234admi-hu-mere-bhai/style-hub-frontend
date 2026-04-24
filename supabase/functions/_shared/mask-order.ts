// Masks an order number for display on lock-screen / inbox previews.
// Shows only the last 4 characters, prefixed with bullet dots.
// Examples:
//   "OD33728273341379510023" -> "••••0023"
//   "MGH51866093"            -> "••••6093"
//   ""                       -> ""
export function maskOrderNumber(orderNumber?: string | null): string {
  if (!orderNumber) return '';
  const trimmed = String(orderNumber).trim();
  if (trimmed.length <= 4) return trimmed;
  return `••••${trimmed.slice(-4)}`;
}
