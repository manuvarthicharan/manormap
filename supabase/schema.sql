-- ==============================================================================
-- REAL ESTATE DISCOVERY RADAR — PRODUCTION SUPABASE DATABASE SCHEMA
-- Startup-Scalable Architecture: PostGIS Spatial Engine, Google Auth Sync,
-- Row-Level Security (RLS), and High-Performance Geospatial Indexing
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Property Seeker & Investor',
  city TEXT DEFAULT 'Hyderabad',
  state TEXT DEFAULT 'Telangana',
  kyc_verified BOOLEAN DEFAULT FALSE,
  pan_masked TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Automatic Trigger for Supabase Google Auth User Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  price_display TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'rent')),
  category TEXT NOT NULL CHECK (category IN ('Apartment', 'Villa', 'Independent House', 'Plot', 'Commercial', 'Penthouse', 'Agricultural Land')),
  bhk INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 1,
  balconies INTEGER DEFAULT 0,
  area_sqft NUMERIC NOT NULL,
  carpet_area_sqft NUMERIC,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  
  -- Spatial Location (Longitude, Latitude)
  longitude NUMERIC NOT NULL,
  latitude NUMERIC NOT NULL,
  location GEOGRAPHY(Point, 4326),

  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  ready_to_move BOOLEAN DEFAULT TRUE,
  furnishing TEXT DEFAULT 'Unfurnished',
  facing TEXT,
  parking TEXT DEFAULT '1 Dedicated Covered',
  floor_info TEXT,
  maintenance_monthly NUMERIC DEFAULT 0,
  posted_date TEXT DEFAULT 'Just now',
  rera_id TEXT,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Contact Information
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_type TEXT DEFAULT 'Owner',
  contact_email TEXT,

  -- Agricultural Land Survey / Parcel Boundary
  boundary_polygon JSONB,
  boundary_geography GEOGRAPHY(Polygon, 4326),
  land_metrics JSONB,

  -- AI Intelligence & POI analysis cache
  ai_analysis JSONB,
  nearby_pois JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial & Filter Indexes for Production Performance
CREATE INDEX IF NOT EXISTS properties_location_gist ON public.properties USING GIST (location);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties (city);
CREATE INDEX IF NOT EXISTS properties_type_idx ON public.properties (type);
CREATE INDEX IF NOT EXISTS properties_category_idx ON public.properties (category);
CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties (price);
CREATE INDEX IF NOT EXISTS properties_user_id_idx ON public.properties (user_id);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON public.properties (created_at DESC);

-- Trigger to automatically populate PostGIS location geometry from longitude & latitude
CREATE OR REPLACE FUNCTION public.sync_property_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_property_location ON public.properties;
CREATE TRIGGER trigger_sync_property_location
  BEFORE INSERT OR UPDATE OF longitude, latitude ON public.properties
  FOR EACH ROW EXECUTE PROCEDURE public.sync_property_location();

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties Policies
CREATE POLICY "Properties are viewable by everyone"
  ON public.properties FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own properties"
  ON public.properties FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. USER FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON public.favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. High-Performance Spatial Query Stored Procedure
CREATE OR REPLACE FUNCTION public.get_properties_in_bounds(
  min_lng DOUBLE PRECISION,
  min_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION
)
RETURNS SETOF public.properties AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.properties
  WHERE location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography;
END;
$$ LANGUAGE plpgsql STABLE;

