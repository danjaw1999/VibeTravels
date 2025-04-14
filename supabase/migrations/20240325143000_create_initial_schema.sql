-- Migration: create_initial_schema
-- Description: Creates the initial database schema for VibeTravels application
-- Tables: users, travel_notes, attractions
-- Author: Database Team
-- Date: 2024-03-25
--
-- Special considerations:
-- - All tables have RLS enabled with granular policies
-- - Attractions table includes support for geospatial queries
-- - Image fields support Pexels API integration requirements
-- - Includes automatic user sync from auth.users

-- enable required extensions for text search and geospatial functionality
create extension if not exists "pg_trgm";
create extension if not exists "earthdistance" cascade;

-- create users table to store extended user profile information
-- this table is linked to auth.users via trigger
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    profile_description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.users is 'Extended user profiles synchronized with auth.users';
comment on column public.users.password_hash is 'Stores auth-managed password hash, not used for authentication';
comment on column public.users.profile_description is 'Optional user bio or description';

-- create travel notes table for storing user travel plans
create table if not exists public.travel_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    name text not null,
    description text not null,
    is_public boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.travel_notes is 'User travel notes and plans';
comment on column public.travel_notes.name is 'Title or name of the travel note';
comment on column public.travel_notes.description is 'Detailed description of the travel plan';
comment on column public.travel_notes.is_public is 'Controls visibility of the note to other users';

-- create attractions table for storing points of interest within travel notes
create table if not exists public.attractions (
    id uuid primary key default gen_random_uuid(),
    travel_note_id uuid not null references public.travel_notes(id) on delete cascade,
    name text not null,
    description text not null,
    image text,
    image_photographer text,
    image_photographer_url text,
    image_source text,
    latitude numeric(10,8) not null,
    longitude numeric(11,8) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint valid_latitude check (latitude between -90 and 90),
    constraint valid_longitude check (longitude between -180 and 180)
);

comment on table public.attractions is 'Points of interest within travel notes';
comment on column public.attractions.name is 'Name of the attraction (includes both Polish and English versions)';
comment on column public.attractions.description is 'Detailed description including visiting info, prices, and facilities';
comment on column public.attractions.image is 'URL to the attraction image from Pexels';
comment on column public.attractions.image_photographer is 'Name of the Pexels photographer for attribution';
comment on column public.attractions.image_photographer_url is 'URL to the Pexels photographer profile';
comment on column public.attractions.image_source is 'Source URL of the image on Pexels';
comment on column public.attractions.latitude is 'Geographic latitude with 8 decimal precision';
comment on column public.attractions.longitude is 'Geographic longitude with 8 decimal precision';

-- create indexes for performance optimization

-- users table indexes
create index if not exists users_email_idx on public.users(email);
create index if not exists users_created_at_idx on public.users(created_at desc);

-- travel notes table indexes
create index if not exists travel_notes_user_id_idx on public.travel_notes(user_id);
create index if not exists travel_notes_created_at_idx on public.travel_notes(created_at desc);
create index if not exists travel_notes_name_trgm_idx on public.travel_notes using gin(name gin_trgm_ops);
create index if not exists travel_notes_description_trgm_idx on public.travel_notes using gin(description gin_trgm_ops);

-- attractions table indexes
create index if not exists attractions_travel_note_id_idx on public.attractions(travel_note_id);
create index if not exists attractions_created_at_idx on public.attractions(created_at desc);
create index if not exists attractions_name_trgm_idx on public.attractions using gin(name gin_trgm_ops);
create index if not exists attractions_description_trgm_idx on public.attractions using gin(description gin_trgm_ops);
create index if not exists attractions_location_idx on public.attractions using gist (ll_to_earth(latitude::float8, longitude::float8));

-- enable row level security on all tables
alter table public.users enable row level security;
alter table public.travel_notes enable row level security;
alter table public.attractions enable row level security;

-- users table policies
-- allow authenticated users to see all user profiles
create policy "Users can view all profiles"
    on public.users
    for select
    to authenticated
    using (true);

-- allow users to update their own profile
create policy "Users can update own profile"
    on public.users
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- travel notes table policies
-- allow anyone to view public notes
create policy "Anyone can view public notes"
    on public.travel_notes
    for select
    using (is_public);

-- allow authenticated users to view their own notes
create policy "Users can view own notes"
    on public.travel_notes
    for select
    to authenticated
    using (user_id = auth.uid());

-- allow authenticated users to create their own notes
create policy "Users can create own notes"
    on public.travel_notes
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- allow users to update their own notes
create policy "Users can update own notes"
    on public.travel_notes
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- allow users to delete their own notes
create policy "Users can delete own notes"
    on public.travel_notes
    for delete
    to authenticated
    using (user_id = auth.uid());

-- attractions table policies
-- allow viewing attractions in public notes
create policy "Anyone can view attractions in public notes"
    on public.attractions
    for select
    using (
        exists (
            select 1 from public.travel_notes
            where travel_notes.id = attractions.travel_note_id
            and travel_notes.is_public
        )
    );

-- allow authenticated users to view attractions in their own notes
create policy "Users can view attractions in own notes"
    on public.attractions
    for select
    to authenticated
    using (
        exists (
            select 1 from public.travel_notes
            where travel_notes.id = attractions.travel_note_id
            and travel_notes.user_id = auth.uid()
        )
    );

-- allow adding attractions to own notes
create policy "Users can add attractions to own notes"
    on public.attractions
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.travel_notes
            where travel_notes.id = travel_note_id
            and travel_notes.user_id = auth.uid()
        )
    );

-- allow updating attractions in own notes
create policy "Users can update attractions in own notes"
    on public.attractions
    for update
    to authenticated
    using (
        exists (
            select 1 from public.travel_notes
            where travel_notes.id = travel_note_id
            and travel_notes.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.travel_notes
            where travel_notes.id = travel_note_id
            and travel_notes.user_id = auth.uid()
        )
    );

-- allow deleting attractions from own notes
create policy "Users can delete attractions from own notes"
    on public.attractions
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.travel_notes
            where travel_notes.id = travel_note_id
            and travel_notes.user_id = auth.uid()
        )
    );

-- create function to automatically sync users from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.users (id, email, password_hash, profile_description)
    values (
        new.id,
        new.email,
        'auth_managed',
        coalesce(new.raw_user_meta_data->>'profile_description', '')
    );
    return new;
end;
$$;

comment on function public.handle_new_user() is 'Automatically creates a user profile when a new user signs up via Supabase Auth';

-- create trigger to handle new user creation
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user(); 