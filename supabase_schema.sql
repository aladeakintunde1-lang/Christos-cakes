-- SQL to create the necessary tables in Supabase
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customerName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfillmentType TEXT NOT NULL,
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

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

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
