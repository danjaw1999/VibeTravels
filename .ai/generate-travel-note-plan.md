# API Endpoint Implementation Plan: Create Travel Note

## 1. Overview

Endpoint for creating new travel notes in the system. Creates a travel note associated with the authenticated user and returns the created note with an empty attractions array. Implements proper validation, error handling, and security measures.

## 2. Request Details

- **HTTP Method**: POST
- **URL Pattern**: `/api/travel-notes`
- **Headers**:
  - `Authorization: Bearer <token>` (required)
  - `Content-Type: application/json`
- **Request Body**:
  ```typescript
  interface TravelNoteCreateCommand {
    name: string; // required
    description: string; // required
    isPublic?: boolean; // optional
  }
  ```

## 3. Types and Schemas

### Data Types

```typescript
// src/lib/schemas/travel-note.schema.ts
import { z } from "zod";

export const createTravelNoteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  isPublic: z.boolean().optional(),
});

// src/lib/services/travel-note.service.ts
import type { TravelNoteCreateCommand, TravelNoteDTO } from "../types";
import type { SupabaseClient } from "../db/supabase.client";

export class TravelNoteService {
  constructor(private readonly supabase: SupabaseClient) {}

  async createTravelNote(userId: string, command: TravelNoteCreateCommand): Promise<TravelNoteDTO>;
  private mapToDTO(dbNote: DBTravelNote): TravelNoteDTO;
}
```

## 4. Data Flow

1. Request Validation:

   - Validate JWT token
   - Parse and validate request body using Zod schema
   - Extract user ID from token

2. Database Operations:

   ```sql
   INSERT INTO travel_notes (
     id, user_id, name, description, is_public
   ) VALUES (
     gen_random_uuid(), :userId, :name, :description, COALESCE(:isPublic, true)
   ) RETURNING *;
   ```

3. Response Mapping:
   - Map database result to DTO
   - Add empty attractions array
   - Return 201 with created note

## 5. Security Considerations

1. Authentication:

   - Validate JWT token from Authorization header
   - Extract and verify user ID
   - Ensure token has not expired

2. Authorization:

   - RLS policy ensures users can only create notes for themselves

   ```sql
   CREATE POLICY "Users can create their own travel notes" ON travel_notes
   FOR INSERT TO authenticated
   WITH CHECK (auth.uid() = user_id);
   ```

3. Input Validation:
   - Sanitize all input fields
   - Validate string lengths
   - Prevent SQL injection via parameterized queries

## 6. Error Handling

1. Authentication Errors (401):

   ```typescript
   if (!user) {
     return new Response(
       JSON.stringify({
         error: "Unauthorized",
       }),
       { status: 401 }
     );
   }
   ```

2. Validation Errors (400):

   ```typescript
   try {
     const data = createTravelNoteSchema.parse(await request.json());
   } catch (error) {
     if (error instanceof z.ZodError) {
       return new Response(
         JSON.stringify({
           error: "Invalid input data",
           details: error.errors,
         }),
         { status: 400 }
       );
     }
   }
   ```

3. Server Errors (500):
   ```typescript
   catch (error) {
     console.error('Failed to create travel note:', error);
     return new Response(JSON.stringify({
       error: 'Internal server error'
     }), { status: 500 });
   }
   ```

## 7. Performance Considerations

1. Database:

   - Single INSERT operation
   - Uses default values where possible
   - Returns only necessary fields

2. Response:
   - No N+1 queries (empty attractions array)
   - No unnecessary data transformations
   - Efficient JSON serialization

## 8. Implementation Steps

1. Create Schema and Service:

   ```bash
   mkdir -p src/lib/schemas src/lib/services
   touch src/lib/schemas/travel-note.schema.ts
   touch src/lib/services/travel-note.service.ts
   ```

2. Implement Route Handler:

   ```typescript
   // src/pages/api/travel-notes.ts
   import type { APIRoute } from "astro";
   import { createTravelNoteSchema } from "../../lib/schemas/travel-note.schema";
   import { TravelNoteService } from "../../lib/services/travel-note.service";

   export const prerender = false;

   export const POST: APIRoute = async ({ request, locals }) => {
     try {
       // 1. Get and validate user
       const user = locals.supabase.auth.user();
       if (!user) {
         return new Response(
           JSON.stringify({
             error: "Unauthorized",
           }),
           { status: 401 }
         );
       }

       // 2. Parse and validate input
       const data = createTravelNoteSchema.parse(await request.json());

       // 3. Create service and handle request
       const service = new TravelNoteService(locals.supabase);
       const note = await service.createTravelNote(user.id, data);

       // 4. Return response
       return new Response(JSON.stringify(note), {
         status: 201,
         headers: {
           "Content-Type": "application/json",
         },
       });
     } catch (error) {
       // Handle errors appropriately
       if (error instanceof z.ZodError) {
         return new Response(
           JSON.stringify({
             error: "Invalid input data",
             details: error.errors,
           }),
           { status: 400 }
         );
       }

       console.error("Failed to create travel note:", error);
       return new Response(
         JSON.stringify({
           error: "Internal server error",
         }),
         { status: 500 }
       );
     }
   };
   ```

3. Implement Service:

   ```typescript
   // src/lib/services/travel-note.service.ts
   export class TravelNoteService {
     constructor(private readonly supabase: SupabaseClient) {}

     async createTravelNote(userId: string, command: TravelNoteCreateCommand): Promise<TravelNoteDTO> {
       const { data, error } = await this.supabase
         .from("travel_notes")
         .insert({
           user_id: userId,
           name: command.name,
           description: command.description,
           is_public: command.isPublic,
         })
         .select()
         .single();

       if (error) throw error;
       return this.mapToDTO(data);
     }

     private mapToDTO(dbNote: DBTravelNote): TravelNoteDTO {
       return {
         id: dbNote.id,
         userId: dbNote.user_id,
         name: dbNote.name,
         description: dbNote.description,
         isPublic: dbNote.is_public,
         createdAt: dbNote.created_at,
         attractions: [],
       };
     }
   }
   ```

4. Test Implementation:
   - Unit tests for schema validation
   - Unit tests for service methods
   - Integration tests for API endpoint
   - Manual testing with Postman/cURL
