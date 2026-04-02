# Data Model — Christos Cakes

## Tables

### `orders`
-   `id`: TEXT PRIMARY KEY (UUID string)
-   `customerName`: TEXT NOT NULL
-   `email`: TEXT NOT NULL
-   `phone`: TEXT NOT NULL
-   `fulfillmentType`: TEXT NOT NULL (Delivery / Collection)
-   `category`: TEXT NOT NULL DEFAULT 'Cake'
-   `pastries`: JSONB DEFAULT '[]'::jsonb
-   `postcode`: TEXT
-   `address`: TEXT
-   `deliveryFee`: NUMERIC NOT NULL DEFAULT 0
-   `deliveryDate`: TEXT NOT NULL
-   `deliveryTimeSlot`: TEXT NOT NULL
-   `flavor`: TEXT NOT NULL
-   `size`: TEXT NOT NULL
-   `messageOnCake`: TEXT
-   `inspirationImage`: TEXT (Base64 string)
-   `inspirationLink`: TEXT
-   `totalPrice`: NUMERIC NOT NULL DEFAULT 0
-   `status`: TEXT NOT NULL DEFAULT 'Pending'
-   `distance`: NUMERIC
-   `createdAt`: TEXT NOT NULL DEFAULT now()::text
-   `dummy_data`: BOOLEAN DEFAULT false

### `gallery`
-   `id`: TEXT PRIMARY KEY (UUID string)
-   `url`: TEXT NOT NULL
-   `displayMode`: TEXT NOT NULL (original / square)
-   `createdAt`: TEXT NOT NULL DEFAULT now()::text
-   `dummy_data`: BOOLEAN DEFAULT false

### `settings`
-   `id`: INTEGER PRIMARY KEY DEFAULT 1
-   `logoUrl`: TEXT
-   `adminWhatsAppNumber`: TEXT
-   `dummy_data`: BOOLEAN DEFAULT false

### `pastries`
-   `id`: TEXT PRIMARY KEY (UUID string)
-   `name`: TEXT NOT NULL
-   `description`: TEXT NOT NULL
-   `price`: NUMERIC NOT NULL DEFAULT 0
-   `order`: INTEGER NOT NULL DEFAULT 0
-   `dummy_data`: BOOLEAN DEFAULT false

## Relationships
-   `orders` → `pastries`: The `pastries` JSONB column in `orders` stores a snapshot of selected items.

## Row Level Security (RLS)
-   `orders`: Public insert, public select by ID.
-   `gallery`: Public select, admin insert/delete.
-   `settings`: Public select, admin update.
-   `pastries`: Public select, admin manage.
