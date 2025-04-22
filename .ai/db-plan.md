# Database Schema for VibeTravels (MVP)

## 1. Tables

### Users

- **id**: UUID PRIMARY KEY, default value generated using `gen_random_uuid()`
- **email**: VARCHAR(255) NOT NULL, UNIQUE
- **password_hash**: VARCHAR(255) NOT NULL
- **profile_description**: TEXT
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

### TravelNotes

- **id**: UUID PRIMARY KEY, default value generated using `gen_random_uuid()`
- **user_id**: UUID NOT NULL, REFERENCES Users(id) ON DELETE CASCADE
- **name**: TEXT NOT NULL
- **description**: TEXT NOT NULL
- **is_public**: BOOLEAN NOT NULL DEFAULT TRUE -- Indicates if the note is publicly visible
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

### Attractions

- **id**: UUID PRIMARY KEY, default value generated using `gen_random_uuid()`
- **travel_note_id**: UUID NOT NULL, REFERENCES TravelNotes(id) ON DELETE CASCADE
- **name**: TEXT NOT NULL -- Includes both Polish name and English name in parentheses
- **description**: TEXT NOT NULL -- Detailed description including visiting info, prices, and facilities
- **image**: TEXT -- URL to the attraction image
- **image_photographer**: TEXT -- Name of the photographer (from Pexels)
- **image_photographer_url**: TEXT -- URL to photographer's profile (from Pexels)
- **image_source**: TEXT -- Source URL of the image (from Pexels)
- **latitude**: NUMERIC(10,8) NOT NULL -- High-precision value for geographic latitude
- **longitude**: NUMERIC(11,8) NOT NULL -- High-precision value for geographic longitude
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

## 2. Relationships

- Each **User** can have many **TravelNotes** (1:n relationship).
- Each **TravelNote** can have many **Attractions** (1:n relationship).

## 3. Indexes

- Unique index on `Users(email)`.
- Index on `TravelNotes(user_id)` to optimize lookups by owner.
- Index on `Attractions(travel_note_id)` to optimize lookups by travel note.
- Index on `Attractions(name)` to optimize searching for existing attractions and image reuse.
- (Optional) Composite index on `Attractions(latitude, longitude)` to support geospatial queries.

## 4. Row-Level Security (RLS) Policies

- Enable RLS on the **TravelNotes** and **Attractions** tables.
- For **TravelNotes**: Define a policy to allow access if the travel note is public (`is_public = TRUE`) or if the current user's ID matches the `user_id` field.
- For **Attractions**: Define a policy that enforces access via the associated **TravelNote**'s ownership or public visibility.
- These policies ensure that users can view public notes and can only modify their own private notes and related attractions.

## 5. Additional Notes

- All tables include standard timestamp columns (`created_at`, `updated_at`) for audit and tracking purposes.
- UUIDs are used as primary keys to ensure global uniqueness and to improve security.
- Cascading deletes (ON DELETE CASCADE) are configured to maintain referential integrity when a user or travel note is removed.
- Image metadata fields are used to comply with Pexels API attribution requirements.
- Attraction descriptions now include comprehensive information about visiting times, prices, and facilities.
- Name field includes both Polish and English versions to improve searchability and image matching.
