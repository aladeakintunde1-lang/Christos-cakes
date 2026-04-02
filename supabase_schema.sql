-- SQL to create the necessary tables in Supabase
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
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
  numberOfTiers INTEGER,
  tierArrangement TEXT,
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

-- Pastries Table
CREATE TABLE IF NOT EXISTS pastries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0
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

-- Seed Data for Pastries
INSERT INTO pastries (id, name, description, price, "order")
VALUES 
  ('puffpuff', 'Puffpuff (Pack of 50)', 'Traditional sweet fried dough balls - £25 per pack', 25, 0),
  ('meatpie-large', 'Meat Pie (Large) - Pack of 20', 'Savory pastry filled with seasoned minced meat - £50 per pack', 50, 1),
  ('meatpie-small', 'Meat Pie (Small) - Pack of 30', 'Savory pastry filled with seasoned minced meat - £50 per pack', 50, 2),
  ('sausageroll', 'Sausage Roll - Pack of 30', 'Flaky pastry wrapped around seasoned sausage meat - £50 per pack', 50, 3),
  ('fishroll', 'Fish Roll', 'Crispy pastry filled with spiced fish', 0, 4),
  ('smallchops', 'Small Chops', 'Assorted finger foods', 0, 5),
  ('platter', 'Platter', 'A luxury assortment of our finest pastries', 0, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  "order" = EXCLUDED."order";

-- Initial Settings
INSERT INTO settings (id, logoUrl)
VALUES (1, 'https://picsum.photos/seed/christos-cakes-logo/400/400')
ON CONFLICT (id) DO NOTHING;
