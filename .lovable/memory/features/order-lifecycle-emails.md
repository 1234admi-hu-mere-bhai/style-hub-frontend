---
name: Order lifecycle emails
description: Branded transactional emails sent via send-transactional-email for order placed (payu-webhook), shipped (admin-update-order + sync-delhivery-status), delivered (same), and refund-processed (payu-refund). Templates in supabase/functions/_shared/transactional-email-templates/. Idempotency keys derived from order id.
type: feature
---
- 4 templates registered: order-placed, order-shipped, order-delivered, refund-processed
- Triggers:
  - order-placed → payu-webhook after order insert
  - order-shipped → admin-update-order (when tracking_awb assigned or status→shipped) + sync-delhivery-status on transition
  - order-delivered → admin-update-order + sync-delhivery-status on transition to delivered
  - refund-processed → payu-refund (both COD-offline and PayU-API branches)
- Recipient resolved via auth.admin.getUserById + profiles.first_name
- All sends best-effort (try/catch) to never block the primary flow
- Unsubscribe page at /src/pages/Unsubscribe.tsx, route /unsubscribe
