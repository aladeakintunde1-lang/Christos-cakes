# Architecture Overview — Christos Cakes

## Services
-   **Frontend:** React (Vite) — Single-page application.
-   **Backend:** Supabase — Real-time database and RLS.
-   **Automation:** n8n — Webhook-triggered workflows for notifications.
-   **Communication:** Twilio — WhatsApp messaging via n8n.
-   **Deployment:** Vercel — Hosting for the React app.

## Data Flows
1.  **Order Submission:** Customer fills out the form → React app sends data to Supabase → Webhook triggers n8n.
2.  **Admin Notification:** n8n receives webhook → sends WhatsApp message to admin via Twilio.
3.  **Order Management:** Admin updates status in Admin Portal → Supabase updates → client view reflects change.
4.  **Client Invoice:** Admin clicks "Send to Client" → n8n sends WhatsApp message to client with order link.

## Routing Table
-   `/` — Storefront (Gallery & Order Form)
-   `/order/:id` — Order View (Invoice)
-   `/admin` — Admin Portal (Protected)
-   `/prd-preview` — PRD Preview (Development only)
-   `/design-preview` — Design System Preview (Development only)
