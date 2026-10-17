# Make.com Automation & Workflow Synchronization Guide

Christos Cakes features first-class integration with **Make.com** (formerly Integromat) to provide instant, real-time workflow automations for all atelier activities.

Every customer commission, atelier status change, bespoke quotation, and client feedback review automatically triggers your Make.com scenario in real time.

---

## 1. Quick Setup in 2 Minutes

1. **Download the Scenario Blueprint:**
   - In the **Admin Portal > Settings > Make.com Automation**, click **Download Blueprint** (or copy from `/make/christos_cakes_make_blueprint.json`).

2. **Import into Make.com:**
   - Log into [Make.com](https://www.make.com).
   - Click **Create a new scenario**.
   - In the bottom toolbar, click the **... (More)** menu and select **Import Blueprint**.
   - Choose the downloaded `christos_cakes_make_blueprint.json` file.

3. **Configure the Custom Webhook:**
   - Click on the first module in the scenario: **Christos Cakes Webhook Receiver**.
   - Click **Add** to create a new webhook (e.g., name it `Christos Cakes Webhook`).
   - Copy the generated Webhook URL (format: `https://hook.eu1.make.com/...` or `https://hook.us1.make.com/...`).
   - Click **OK**.

4. **Connect & Activate in Christos Cakes:**
   - Return to the Christos Cakes **Admin Portal > Settings**.
   - Paste your URL into the **Make.com Custom Webhook URL** field (it auto-saves immediately).
   - Click **Test Webhook**. You will see a live confirmation with roundtrip latency (e.g. `✓ Responded in 240ms with HTTP 200`).
   - Turn your Make.com scenario **ON** (set Scheduling to *Immediately as data arrives*).

---

## 2. Event Types & Automatic Synchronization

Christos Cakes includes an **Auto-Sync** engine that dispatches an event whenever ANY of the following occurs:

| Event Identifier (`event`) | Legacy (`type`) | Trigger Source | Description & Payload |
|---|---|---|---|
| `order.created` | `NEW_ORDER` | Storefront | Triggered when a client completes the 5-step commission wizard. Contains all cake aesthetics, tiers, flavor palette, pastries breakdown, and delivery timing. |
| `order.status_updated` | `STATUS_UPDATED` | Admin Portal | Triggered whenever an admin changes the status (e.g., `Pending` → `Baking` → `Ready` → `Completed`). Includes `status` and `previousStatus`. |
| `order.quote_updated` | `QUOTE_UPDATED` | Admin Portal | Triggered when pricing or white-glove delivery fees are calculated or altered in the atelier. |
| `order.sent_to_client` | `SEND_ORDER` | Admin Portal | Triggered when the admin clicks **Send Order to Client**. Dispatches quotation notification and invoice link to the client. |
| `feedback.submitted` | `NEW_FEEDBACK` | Customer View | Triggered when a client rates their cake and leaves a reflection. Contains `feedbackRating` (1-5) and `feedbackComment`. |
| `order.updated` | `ORDER_UPDATED` | Admin Portal | Triggered if order details, address, or specifications are modified. |
| `test.ping` | `TEST_PING` | Admin Portal | Verification ping generated when clicking **Test Webhook**. |

---

## 3. Webhook Payload Reference

The payload sent to Make.com is structured, clean, and sanitized (large base64 image strings are omitted to prevent HTTP 413 payload limits, while tracking links and flags are preserved):

```json
{
  "event": "order.status_updated",
  "type": "STATUS_UPDATED",
  "id": "ORD-1729182394",
  "customerName": "Lady Eleanor Vance",
  "email": "eleanor@example.co.uk",
  "phone": "+44 7700 900123",
  "status": "Baking",
  "previousStatus": "Pending",
  "totalPrice": 185.00,
  "deliveryFee": 15.00,
  "fulfillmentType": "Delivery",
  "deliveryDate": "2026-10-25",
  "deliveryTimeSlot": "Morning (9am - 12pm)",
  "category": "Both",
  "flavor": "Madagascan Vanilla Bean & Wild Raspberry Buttercream",
  "size": "8 inch Luxury Tier",
  "numberOfTiers": 2,
  "tierArrangement": "Base 8\", Top 6\" with edible gold leaf detailing",
  "messageOnCake": "Happy 30th Eleanor",
  "pastriesSummary": "6x Rose Water Macarons, 4x Pistachio Financiers",
  "hasInspirationImage": true,
  "inspirationLink": "https://instagram.com/p/example",
  "address": "42 High Street, Taunton, Somerset",
  "postcode": "TA1 3PN",
  "orderUrl": "https://your-domain.vercel.app/order/ORD-1729182394",
  "appUrl": "https://your-domain.vercel.app",
  "timestamp": "2026-10-17T11:00:00.000Z",
  "source": "Christos Cakes Luxury Bakery"
}
```

---

## 4. Customizing Your Make.com Modules

The included scenario blueprint contains:
1. **Custom Webhook Receiver** (`gateway:CustomWebHook`): Captures the live incoming webhook data and parses all order fields.
2. **Basic Router** (`builtin:BasicRouter`): Routes execution into separate branches based on `event`.
3. **Notification Modules**:
   - You can replace or augment the email notifications with:
     * **Twilio WhatsApp / SMS**: Send WhatsApp messages directly to clients.
     * **Google Sheets / Airtable**: Append order rows to your accounting ledger.
     * **Slack / Discord**: Send alerts to your kitchen channel.
     * **Stripe / Xero / QuickBooks**: Automatically create invoices when quotes are approved.
4. **Webhook Respond** (`gateway:WebhookRespond`): Returns `{ "success": true, "synchronized": true }` with status 200 to acknowledge receipt.
