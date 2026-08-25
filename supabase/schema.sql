-- ============================================================
-- Real Estate Intelligence Dashboard — Supabase Schema
-- ============================================================
-- Run this in the Supabase SQL Editor to set up all tables.
-- All fields are optional except primary keys and auto-generated fields.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AREAS / LOCALITIES
-- ============================================================
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  taluk TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT,
  current_avg_rate NUMERIC,
  rate_unit TEXT DEFAULT 'sq.ft',
  development_level TEXT,
  important_places TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Auto-generated display ID (P-001, P-002, etc.)
  display_id TEXT,
  
  -- Basic info
  title TEXT,
  property_type TEXT, -- Plot, Site, Land, Apartment, Villa, Commercial, Agricultural, Other
  
  -- Location
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  area_name TEXT, -- Denormalized for quick display
  address TEXT,
  city TEXT,
  plot_number TEXT,
  survey_number TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- Dimensions
  length NUMERIC,
  width NUMERIC,
  total_area NUMERIC,
  area_unit TEXT DEFAULT 'sq.ft', -- sq.ft, sq.yards, acre, guntha, other
  
  -- Details
  facing TEXT, -- N, S, E, W, NE, NW, SE, SW, Unknown
  road_width TEXT,
  is_corner BOOLEAN,
  development_status TEXT,
  
  -- Status
  status TEXT DEFAULT 'Available', -- Available, Under Discussion, Reserved, Sold, Inactive, Other
  
  -- Pricing
  asking_price NUMERIC,
  price_per_sqft NUMERIC,
  price_per_sqyard NUMERIC,
  total_estimated_value NUMERIC,
  previous_price NUMERIC,
  purchase_price NUMERIC,
  expected_selling_price NUMERIC,
  
  -- Description
  description TEXT,
  internal_notes TEXT,
  
  -- Additional
  nearby_landmark TEXT,
  development_potential TEXT,
  primary_image_url TEXT,
  
  -- Meta
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate display_id
CREATE OR REPLACE FUNCTION generate_property_display_id()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM 3) AS INTEGER)), 0) + 1
  INTO next_num
  FROM properties
  WHERE user_id = NEW.user_id;
  
  NEW.display_id := 'P-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_property_display_id
  BEFORE INSERT ON properties
  FOR EACH ROW
  WHEN (NEW.display_id IS NULL)
  EXECUTE FUNCTION generate_property_display_id();

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  alternate_phone TEXT,
  email TEXT,
  company TEXT,
  role TEXT, -- Builder, Owner, Seller, Buyer, Broker, Agent, Developer, Investor, Contractor, Lawyer, Government, Other
  area TEXT,
  address TEXT,
  notes TEXT,
  follow_up_date DATE,
  status TEXT DEFAULT 'Active', -- Active, Inactive, Important
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPERTY ↔ CONTACT (many-to-many with role)
-- ============================================================
CREATE TABLE property_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT, -- Owner, Builder, Seller, Buyer, Broker, Agent
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, contact_id, relationship_type)
);

-- ============================================================
-- DEVELOPMENTS / PROJECTS
-- ============================================================
CREATE TABLE developments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  project_type TEXT, -- Road, Highway, Ring Road, Layout, Hospital, College, School, Industry, Commercial, Residential, Government, Infrastructure, Railway, Other
  location TEXT,
  nearby_area TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT,
  current_status TEXT DEFAULT 'Planned', -- Planned, Approved, In Progress, Completed, Stalled, Cancelled
  start_date DATE,
  expected_completion DATE,
  source_reference TEXT,
  expected_impact TEXT, -- Very High, High, Medium, Low, Unknown
  impact_explanation TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEVELOPMENT ↔ AREA (many-to-many)
-- ============================================================
CREATE TABLE development_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  development_id UUID REFERENCES developments(id) ON DELETE CASCADE NOT NULL,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(development_id, area_id)
);

-- ============================================================
-- PROPERTY ↔ DEVELOPMENT (many-to-many)
-- ============================================================
CREATE TABLE property_developments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  development_id UUID REFERENCES developments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, development_id)
);

-- ============================================================
-- CONTACT ↔ DEVELOPMENT (many-to-many)
-- ============================================================
CREATE TABLE contact_developments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  development_id UUID REFERENCES developments(id) ON DELETE CASCADE NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, development_id)
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  category TEXT, -- Sale Deed, RTC, Khata, EC, Layout Approval, Agreement, Tax Document, Survey Document, Ownership Document, Legal Document, Other
  description TEXT,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  expiry_date DATE,
  review_date DATE,
  status TEXT DEFAULT 'Active', -- Active, Expired, Needs Review
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT,
  -- Polymorphic link (only one should be set)
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  entity_type TEXT, -- property, contact, area, development, general
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Property ↔ Tag
CREATE TABLE property_tags (
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (property_id, tag_id)
);

-- Contact ↔ Tag
CREATE TABLE contact_tags (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (contact_id, tag_id)
);

-- Development ↔ Tag
CREATE TABLE development_tags (
  development_id UUID REFERENCES developments(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (development_id, tag_id)
);

-- Note ↔ Tag
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (note_id, tag_id)
);

-- ============================================================
-- PRICE HISTORY (for areas)
-- ============================================================
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER,
  rate NUMERIC NOT NULL,
  rate_unit TEXT DEFAULT 'sq.ft',
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(area_id, year, month)
);

-- ============================================================
-- FOLLOW-UPS / REMINDERS
-- ============================================================
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  due_time TIME,
  -- Polymorphic link
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  entity_type TEXT, -- property, contact, development, general
  status TEXT DEFAULT 'Pending', -- Pending, Completed, Cancelled
  priority TEXT DEFAULT 'Normal', -- High, Normal, Low
  completed_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL, -- property, contact, document, development, area, note
  entity_id UUID NOT NULL,
  entity_name TEXT,
  action TEXT NOT NULL, -- created, updated, deleted, status_changed, price_changed, document_uploaded, image_uploaded
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT REQUIREMENTS (configurable per property)
-- ============================================================
CREATE TABLE document_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default document requirements
INSERT INTO document_requirements (id, user_id, name, sort_order) VALUES
  (uuid_generate_v4(), NULL, 'Sale Deed', 1),
  (uuid_generate_v4(), NULL, 'RTC', 2),
  (uuid_generate_v4(), NULL, 'Khata', 3),
  (uuid_generate_v4(), NULL, 'EC', 4),
  (uuid_generate_v4(), NULL, 'Layout Approval', 5);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_properties_user ON properties(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_properties_status ON properties(status) WHERE NOT is_deleted;
CREATE INDEX idx_properties_type ON properties(property_type) WHERE NOT is_deleted;
CREATE INDEX idx_properties_area ON properties(area_id) WHERE NOT is_deleted;
CREATE INDEX idx_properties_city ON properties(city) WHERE NOT is_deleted;
CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(area_name, '') || ' ' || COALESCE(address, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(description, '')));

CREATE INDEX idx_contacts_user ON contacts(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_contacts_search ON contacts USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(company, '') || ' ' || COALESCE(area, '') || ' ' || COALESCE(notes, '')));

CREATE INDEX idx_developments_user ON developments(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_areas_user ON areas(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_documents_property ON documents(property_id) WHERE NOT is_deleted;
CREATE INDEX idx_notes_user ON notes(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_follow_ups_user ON follow_ups(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_follow_ups_due ON follow_ups(due_date) WHERE status = 'Pending' AND NOT is_deleted;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties: users can only see/manage their own properties
CREATE POLICY properties_select ON properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY properties_insert ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY properties_update ON properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY properties_delete ON properties FOR DELETE USING (auth.uid() = user_id);

-- Property images
CREATE POLICY property_images_select ON property_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY property_images_insert ON property_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_images_delete ON property_images FOR DELETE USING (auth.uid() = user_id);

-- Contacts
CREATE POLICY contacts_select ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY contacts_insert ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY contacts_update ON contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY contacts_delete ON contacts FOR DELETE USING (auth.uid() = user_id);

-- Property contacts (access via property ownership)
CREATE POLICY property_contacts_select ON property_contacts FOR SELECT USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);
CREATE POLICY property_contacts_insert ON property_contacts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);
CREATE POLICY property_contacts_delete ON property_contacts FOR DELETE USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);

-- Developments
CREATE POLICY developments_select ON developments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY developments_insert ON developments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY developments_update ON developments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY developments_delete ON developments FOR DELETE USING (auth.uid() = user_id);

-- Development areas
CREATE POLICY dev_areas_select ON development_areas FOR SELECT USING (
  EXISTS (SELECT 1 FROM developments WHERE id = development_id AND user_id = auth.uid())
);
CREATE POLICY dev_areas_insert ON development_areas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM developments WHERE id = development_id AND user_id = auth.uid())
);
CREATE POLICY dev_areas_delete ON development_areas FOR DELETE USING (
  EXISTS (SELECT 1 FROM developments WHERE id = development_id AND user_id = auth.uid())
);

-- Property developments
CREATE POLICY prop_dev_select ON property_developments FOR SELECT USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);
CREATE POLICY prop_dev_insert ON property_developments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);
CREATE POLICY prop_dev_delete ON property_developments FOR DELETE USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);

-- Contact developments
CREATE POLICY contact_dev_select ON contact_developments FOR SELECT USING (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);
CREATE POLICY contact_dev_insert ON contact_developments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);
CREATE POLICY contact_dev_delete ON contact_developments FOR DELETE USING (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);

-- Documents
CREATE POLICY documents_select ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY documents_insert ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY documents_update ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY documents_delete ON documents FOR DELETE USING (auth.uid() = user_id);

-- Notes
CREATE POLICY notes_select ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notes_insert ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY notes_update ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notes_delete ON notes FOR DELETE USING (auth.uid() = user_id);

-- Tags
CREATE POLICY tags_select ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tags_insert ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tags_update ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY tags_delete ON tags FOR DELETE USING (auth.uid() = user_id);

-- Property tags
CREATE POLICY prop_tags_select ON property_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);
CREATE POLICY prop_tags_insert ON property_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);
CREATE POLICY prop_tags_delete ON property_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);

-- Contact tags
CREATE POLICY contact_tags_select ON contact_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);
CREATE POLICY contact_tags_insert ON contact_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);
CREATE POLICY contact_tags_delete ON contact_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);

-- Development tags
CREATE POLICY dev_tags_select ON development_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM developments WHERE id = development_id AND user_id = auth.uid())
);
CREATE POLICY dev_tags_insert ON development_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM developments WHERE id = development_id AND user_id = auth.uid())
);
CREATE POLICY dev_tags_delete ON development_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM developments WHERE id = development_id AND user_id = auth.uid())
);

-- Note tags
CREATE POLICY note_tags_select ON note_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM notes WHERE id = note_id AND user_id = auth.uid())
);
CREATE POLICY note_tags_insert ON note_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM notes WHERE id = note_id AND user_id = auth.uid())
);
CREATE POLICY note_tags_delete ON note_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM notes WHERE id = note_id AND user_id = auth.uid())
);

-- Price history
CREATE POLICY price_history_select ON price_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY price_history_insert ON price_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY price_history_update ON price_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY price_history_delete ON price_history FOR DELETE USING (auth.uid() = user_id);

-- Follow-ups
CREATE POLICY follow_ups_select ON follow_ups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY follow_ups_insert ON follow_ups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY follow_ups_update ON follow_ups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY follow_ups_delete ON follow_ups FOR DELETE USING (auth.uid() = user_id);

-- Activity log
CREATE POLICY activity_select ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY activity_insert ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Areas
CREATE POLICY areas_select ON areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY areas_insert ON areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY areas_update ON areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY areas_delete ON areas FOR DELETE USING (auth.uid() = user_id);

-- Document requirements
CREATE POLICY doc_req_select ON document_requirements FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY doc_req_insert ON document_requirements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY doc_req_update ON document_requirements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY doc_req_delete ON document_requirements FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS (run these separately in Supabase dashboard)
-- ============================================================
-- Create buckets: 'property-images' and 'documents'
-- Set both to private (not public)
-- Add RLS policies for authenticated users

-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies (run in SQL editor):
-- CREATE POLICY "Users can upload property images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view their property images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their property images" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view their documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_developments_updated_at BEFORE UPDATE ON developments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_areas_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_follow_ups_updated_at BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
