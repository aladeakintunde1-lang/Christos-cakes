# Automation Workflows — Christos Cakes

## Workflow Overview
The automation workflow is hosted on n8n and handles all external communications via Twilio.

## Intent Branches

### `NEW_ORDER`
-   **Trigger:** New order submission from the storefront.
-   **Action:** n8n receives the webhook and sends a WhatsApp notification to the admin with order details.
-   **Payload:** Customer name, size, flavor, delivery date, message on cake, and admin portal link.

### `SEND_ORDER`
-   **Trigger:** Admin clicks "Send to Client" in the Admin Portal.
-   **Action:** n8n receives the webhook and sends a WhatsApp message to the client with a link to their order view.
-   **Payload:** Customer name, total price, and order view link.

### `DAILY_SUMMARY`
-   **Trigger:** Cron job at 8:00 AM daily.
-   **Action:** n8n fetches all active orders for the current week and sends a summary to the admin.
-   **Payload:** List of customer names, delivery dates, and order details.

## Error Paths
-   **Webhook Failure:** Log error and notify admin via email (if configured).
-   **Twilio Failure:** Log error and notify admin.
-   **Supabase Failure:** Log error and notify admin.
