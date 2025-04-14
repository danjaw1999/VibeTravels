-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    profile_description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create travel notes table
CREATE TABLE IF NOT EXISTS public.travel_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL,
    is_public boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create attractions table
CREATE TABLE IF NOT EXISTS public.attractions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_note_id uuid NOT NULL REFERENCES public.travel_notes(id) ON DELETE CASCADE,
    name text NOT NULL, -- Includes both Polish name and English name in parentheses
    description text NOT NULL, -- Detailed description including visiting info, prices, and facilities
    image text, -- URL to the attraction image
    image_photographer text, -- Name of the photographer (from Pexels)
    image_photographer_url text, -- URL to photographer's profile (from Pexels)
    image_source text, -- Source URL of the image (from Pexels)
    latitude numeric(10,8) NOT NULL, -- High-precision value for geographic latitude
    longitude numeric(11,8) NOT NULL, -- High-precision value for geographic longitude
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at DESC);

CREATE INDEX IF NOT EXISTS travel_notes_user_id_idx ON public.travel_notes(user_id);
CREATE INDEX IF NOT EXISTS travel_notes_created_at_idx ON public.travel_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS attractions_travel_note_id_idx ON public.attractions(travel_note_id);
CREATE INDEX IF NOT EXISTS attractions_created_at_idx ON public.attractions(created_at DESC);
CREATE INDEX IF NOT EXISTS attractions_name_trgm_idx ON public.attractions USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS attractions_location_idx ON public.attractions USING gist (ll_to_earth(latitude::float8, longitude::float8));

-- Create text search indexes for improved search functionality
CREATE INDEX IF NOT EXISTS travel_notes_name_trgm_idx ON public.travel_notes USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS travel_notes_description_trgm_idx ON public.travel_notes USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS attractions_description_trgm_idx ON public.attractions USING gin(description gin_trgm_ops);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY users_select ON public.users
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY users_update ON public.users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Create RLS policies for travel notes
CREATE POLICY notes_select ON public.travel_notes
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY notes_insert ON public.travel_notes
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY notes_update ON public.travel_notes
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY notes_delete ON public.travel_notes
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Create RLS policies for attractions
CREATE POLICY attractions_select ON public.attractions
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.travel_notes
        WHERE travel_notes.id = attractions.travel_note_id
        AND (travel_notes.user_id = auth.uid() OR travel_notes.is_public = true)
    ));

CREATE POLICY attractions_insert ON public.attractions
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.travel_notes
        WHERE travel_notes.id = travel_note_id
        AND travel_notes.user_id = auth.uid()
    ));

CREATE POLICY attractions_update ON public.attractions
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.travel_notes
        WHERE travel_notes.id = travel_note_id
        AND travel_notes.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.travel_notes
        WHERE travel_notes.id = travel_note_id
        AND travel_notes.user_id = auth.uid()
    ));

CREATE POLICY attractions_delete ON public.attractions
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.travel_notes
        WHERE travel_notes.id = travel_note_id
        AND travel_notes.user_id = auth.uid()
    ));

-- Create trigger for syncing auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, profile_description)
  VALUES (
    NEW.id,
    NEW.email,
    'auth_managed',
    COALESCE(NEW.raw_user_meta_data->>'profile_description', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 