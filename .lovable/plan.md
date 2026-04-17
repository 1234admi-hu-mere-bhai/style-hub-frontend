
The user wants to add return status tracking to the customer-facing order tracking page (`src/pages/TrackOrder.tsx`).

Looking at the current `TrackOrder.tsx`, the `InternalTracking` component handles two flows:
1. Standard delivery (placed → confirmed → shipped → out_for_delivery → delivered)
2. Replacement flow (delivered → replacement_requested → replacement_shipped → replacement_delivered)

I need to add a third flow for returns. The admin-update-order function already supports these statuses: `return_requested → return_approved → return_picked_up → refund_processed`.

I should also display the return reason if present, and the `Order` interface needs to include `return_reason`. The mini progress on OrderHistory could optionally also reflect returns, but the user specifically asked about the tracking page.

## Plan

**Goal:** Show a dedicated return tracking timeline on `/track-order` when an order's status indicates a return is in progress.

### Changes

1. **`src/pages/TrackOrder.tsx`**
   - Extend the `Order` interface with `return_reason: string | null` and include it in the fetch transformation.
   - In `InternalTracking`, detect a third "return flow" when `order.status` is one of: `return_requested`, `return_approved`, `return_picked_up`, `refund_processed`.
   - Add a `returnSteps` array with 4 steps using appropriate icons (Undo2, CheckCircle2, Truck, IndianRupee/Wallet):
     - Return Requested — "Your return request has been submitted"
     - Return Approved — "Admin has approved your return"
     - Return Picked Up — "Courier has collected the package"
     - Refund Processed — "Refund issued to your original payment method"
   - Update `getStepStatus` to use the matching status list for the return flow.
   - When return flow is active, display the `return_reason` in a small info card above the timeline (if available).

2. **Visual consistency** — use the same stepper styling (success / primary / secondary states) already used for standard and replacement flows. No new dependencies.

### Out of scope
- No DB changes (column already exists).
- No changes to admin panel (already implemented).
- OrderHistory mini-progress remains unchanged unless requested.

