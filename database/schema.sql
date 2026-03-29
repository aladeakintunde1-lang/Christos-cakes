-- Christos Cakes — Database Schema
-- Version 1.0.0 | 2026-03-29

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customerName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfillmentType TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Cake',
  pastries JSONB DEFAULT '[]'::jsonb,
  postcode TEXT,
  address TEXT,
  deliveryFee NUMERIC NOT NULL DEFAULT 0,
  deliveryDate TEXT NOT NULL,
  deliveryTimeSlot TEXT NOT NULL,
  flavor TEXT NOT NULL,
  size TEXT NOT NULL,
  messageOnCake TEXT,
  inspirationImage TEXT,
  inspirationLink TEXT,
  totalPrice NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  distance NUMERIC,
  createdAt TEXT NOT NULL DEFAULT now()::text,
  dummy_data BOOLEAN DEFAULT false
);

-- Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  url TEXT NOT NULL,
  displayMode TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT now()::text,
  dummy_data BOOLEAN DEFAULT false
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  logoUrl TEXT,
  adminWhatsAppNumber TEXT,
  dummy_data BOOLEAN DEFAULT false,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Pastries Table
CREATE TABLE IF NOT EXISTS pastries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  dummy_data BOOLEAN DEFAULT false
);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastries ENABLE ROW LEVEL SECURITY;

-- Policies for 'orders'
CREATE POLICY "Enable insert for everyone" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for everyone" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable update for everyone" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete for everyone" ON orders FOR DELETE USING (true);

-- Policies for 'gallery'
CREATE POLICY "Enable read for everyone" ON gallery FOR SELECT USING (true);
CREATE POLICY "Enable insert for everyone" ON gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for everyone" ON gallery FOR DELETE USING (true);

-- Policies for 'settings'
CREATE POLICY "Enable read for everyone" ON settings FOR SELECT USING (true);
CREATE POLICY "Enable update for everyone" ON settings FOR UPDATE USING (true);
CREATE POLICY "Enable insert for everyone" ON settings FOR INSERT WITH CHECK (true);

-- Policies for 'pastries'
CREATE POLICY "Enable read for everyone" ON pastries FOR SELECT USING (true);
CREATE POLICY "Enable insert for everyone" ON pastries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for everyone" ON pastries FOR UPDATE USING (true);
CREATE POLICY "Enable delete for everyone" ON pastries FOR DELETE USING (true);

-- Helper function for updated_at (if needed later)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';
