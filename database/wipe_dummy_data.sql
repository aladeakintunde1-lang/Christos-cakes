-- Christos Cakes — Wipe Dummy Data
-- Version 1.0.0 | 2026-03-29

-- Wipe only dummy data
DELETE FROM orders WHERE dummy_data = true;
DELETE FROM gallery WHERE dummy_data = true;
DELETE FROM pastries WHERE dummy_data = true;
UPDATE settings SET dummy_data = false WHERE id = 1;
