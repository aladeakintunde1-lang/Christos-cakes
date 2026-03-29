# API Endpoints — Christos Cakes

## Client-Side Endpoints
The application communicates directly with Supabase via the `@supabase/supabase-js` SDK.

### `orders`
-   `POST /rest/v1/orders` — Submit a new order.
-   `GET /rest/v1/orders?id=eq.{id}` — Retrieve a specific order by ID.
-   `PATCH /rest/v1/orders?id=eq.{id}` — Update order status or price (Admin only).

### `gallery`
-   `GET /rest/v1/gallery` — Fetch all gallery images.
-   `POST /rest/v1/gallery` — Add a new image (Admin only).
-   `DELETE /rest/v1/gallery?id=eq.{id}` — Delete an image (Admin only).

### `settings`
-   `GET /rest/v1/settings?id=eq.1` — Fetch site settings.
-   `PATCH /rest/v1/settings?id=eq.1` — Update site settings (Admin only).

## Webhook Endpoints (n8n)
-   `POST /webhook/cake-orders` — Triggered by order submission or admin action.
    -   `type`: `SEND_ORDER` (Admin to Client) or `NEW_ORDER` (Client to Admin).
    -   `payload`: Order data.
