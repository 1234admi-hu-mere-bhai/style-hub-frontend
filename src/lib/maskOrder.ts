// Frontend safety net: masks order numbers in notification text shown on
// home-screen surfaces (NotificationBell popover, Notifications page, etc.).
// Edge functions already write masked text, but this re-masks any historical
// notifications that still contain full order numbers.
//
// Replaces patterns like:
//   "Order #OD33728273341379510023" -> "Order #••••0023"
//   "order MGH51866093"             -> "order ••••6093"
//   "#ABC123XYZ789"                 -> "#••••W789"

const ORDER_REF_REGEX = /(\border\s*#?\s*|#)([A-Z0-9-]{6,})/gi;

export function maskOrderRefsInText(text?: string | null): string {
  if (!text) return '';
  return text.replace(ORDER_REF_REGEX, (_match, prefix: string, id: string) => {
    if (id.length <= 4) return `${prefix}${id}`;
    return `${prefix}••••${id.slice(-4)}`;
  });
}
