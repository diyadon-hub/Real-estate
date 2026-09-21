-- ============================================================
-- Migration V2: Add new property fields
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Number of Floors
ALTER TABLE properties ADD COLUMN IF NOT EXISTS number_of_floors INTEGER;

-- Owner & Agent Details (stored securely, hidden from public view)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_name TEXT;

-- Pricing updates
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS negotiable_price NUMERIC;

-- Google Maps
ALTER TABLE properties ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
