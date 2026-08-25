-- Run this script in the Supabase SQL Editor to completely reset your database
-- BEFORE running the schema.sql file again.

-- 1. Drop the auth trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_property_display_id() CASCADE;

-- 2. Drop all tables to start fresh
DROP TABLE IF EXISTS document_requirements CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS note_tags CASCADE;
DROP TABLE IF EXISTS development_tags CASCADE;
DROP TABLE IF EXISTS contact_tags CASCADE;
DROP TABLE IF EXISTS property_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS contact_developments CASCADE;
DROP TABLE IF EXISTS property_developments CASCADE;
DROP TABLE IF EXISTS development_areas CASCADE;
DROP TABLE IF EXISTS developments CASCADE;
DROP TABLE IF EXISTS property_contacts CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Now you can safely run the contents of schema.sql!
