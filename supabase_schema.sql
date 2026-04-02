-- SQL to create the necessary tables in Supabase
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  "fulfillmentType" TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Cake',
  pastries JSONB DEFAULT '[]'::jsonb,
  postcode TEXT,
  address TEXT,
  "deliveryFee" NUMERIC NOT NULL DEFAULT 0,
  "deliveryDate" TEXT NOT NULL,
  "deliveryTimeSlot" TEXT NOT NULL,
  flavor TEXT NOT NULL,
  size TEXT NOT NULL,
  "messageOnCake" TEXT,
  "inspirationImage" TEXT,
  "inspirationLink" TEXT,
  "totalPrice" NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  distance NUMERIC,
  "numberOfTiers" INTEGER,
  "tierArrangement" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT now()::text,
  dummy_data BOOLEAN DEFAULT false
);

-- Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  displayMode TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT now()::text,
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

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  dummy_data BOOLEAN DEFAULT false
);

-- Helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pastries Table
CREATE TABLE IF NOT EXISTS pastries (
  id TEXT PRIMARY KEY,
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
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastries ENABLE ROW LEVEL SECURITY;

-- Policies for 'admin_users'
CREATE POLICY "Admins can read their own role" ON admin_users FOR SELECT USING (auth.uid() = id);

-- Policies for 'orders'
CREATE POLICY "Enable insert for everyone" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (is_admin());

-- Policies for 'gallery'
CREATE POLICY "Enable read for everyone" ON gallery FOR SELECT USING (true);
CREATE POLICY "Admins can manage gallery" ON gallery FOR ALL USING (is_admin());

-- Policies for 'settings'
CREATE POLICY "Enable read for everyone" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON settings FOR ALL USING (is_admin());

-- Policies for 'pastries'
CREATE POLICY "Enable read for everyone" ON pastries FOR SELECT USING (true);
CREATE POLICY "Admins can manage pastries" ON pastries FOR ALL USING (is_admin());
