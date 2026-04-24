---
name: Order lifecycle emails
description: Branded transactional emails sent via send-transactional-email for order placed, invoice (after PayU success), shipped, delivered, and refund processed. Templates in supabase/functions/_shared/transactional-email-templates/. Idempotency keys derived from order id.
type: feature
---
- 5 templates registered: order-placed, order-invoice, order-shipped, order-delivered, refund-processed
- Triggers:
  - order-placed → payu-webhook after order insert
  - order-invoice → payu-webhook immediately after order-placed (only on successful PayU payment, not COD)
  - order-shipped → admin-update-order (when tracking_awb assigned or status→shipped) + sync-delhivery-status on transition
  - order-delivered → admin-update-order + sync-delhivery-status on transition to delivered
  - refund-processed → payu-refund (both COD-offline and PayU-API branches)
- Recipient resolved via auth.admin.getUserById + profiles.first_name
- All sends best-effort (try/catch) to never block the primary flow
- Unsubscribe page at /src/pages/Unsubscribe.tsx, route /unsubscribe
- Invoice number derived as INV-{last 8 chars of order_number}
