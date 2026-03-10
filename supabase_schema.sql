-- SQL to create the necessary tables in Supabase

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customerName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfillmentType TEXT NOT NULL,
  postcode TEXT,
  address TEXT,
  deliveryFee NUMERIC NOT NULL,
  deliveryDate TEXT NOT NULL,
  deliveryTimeSlot TEXT NOT NULL,
  flavor TEXT NOT NULL,
  size TEXT NOT NULL,
  messageOnCake TEXT,
  cakePrototype TEXT,
  inspirationLink TEXT,
  totalPrice NUMERIC NOT NULL,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

-- Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  displayMode TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  logoUrl TEXT,
  CONSTRAINT single_row CHECK (id = 1)
);
