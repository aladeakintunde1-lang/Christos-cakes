-- Christos Cakes — Dummy Data
-- Version 1.0.0 | 2026-03-29

-- Dummy Pastries
INSERT INTO pastries (id, name, description, price, "order", dummy_data) VALUES
('p1', 'Luxury Macarons', 'Hand-painted vanilla and rose macarons.', 25.00, 0, true),
('p2', 'Artisan Cupcakes', 'Velvety chocolate cupcakes with gold leaf.', 30.00, 1, true),
('p3', 'Gourmet Brownies', 'Rich dark chocolate brownies with sea salt.', 20.00, 2, true);

-- Dummy Orders
INSERT INTO orders (id, customerName, email, phone, fulfillmentType, category, flavor, size, deliveryDate, deliveryTimeSlot, totalPrice, status, createdAt, dummy_data) VALUES
('o1', 'Alice Johnson', 'alice@example.com', '+447123456789', 'Delivery', 'Cake', 'Vanilla Bean', '8 inch', '2026-04-15', '10:00 - 12:00', 150.00, 'Pending', '2026-03-29T10:00:00Z', true),
('o2', 'Bob Smith', 'bob@example.com', '+447987654321', 'Collection', 'Pastries', 'N/A', 'Box of 12', '2026-04-10', '14:00 - 16:00', 45.00, 'Baking', '2026-03-28T15:30:00Z', true);

-- Dummy Gallery
INSERT INTO gallery (id, url, displayMode, createdAt, dummy_data) VALUES
('g1', 'https://picsum.photos/seed/cake1/800/800', 'original', '2026-03-29T09:00:00Z', true),
('g2', 'https://picsum.photos/seed/cake2/800/800', 'original', '2026-03-29T09:05:00Z', true);

-- Initial Settings
INSERT INTO settings (id, logoUrl, adminWhatsAppNumber, dummy_data) VALUES
(1, 'https://picsum.photos/seed/logo/200/200', '+447123456789', true)
ON CONFLICT (id) DO UPDATE SET 
  logoUrl = EXCLUDED.logoUrl,
  adminWhatsAppNumber = EXCLUDED.adminWhatsAppNumber,
  dummy_data = EXCLUDED.dummy_data;
