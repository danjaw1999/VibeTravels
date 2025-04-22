# API Endpoint Implementation Plan: Travel Note Attractions Management

## 1. Endpoint Overview

Implementation of two endpoints for managing attractions within travel notes:

1. Bulk addition of attractions to a travel note
2. Removal of a single attraction from a travel note

Both endpoints require authentication and proper authorization checks to ensure users can only modify their own travel notes.

## 2. Request Details

### Add Attractions

- Method: POST
- URL: `/api/travel-notes/:id/attractions`
- Parameters:
  - Required: `id` (travel note UUID in URL)
  - Body: `AttractionBulkCreateCommand`

```typescript
{
  attractions: Array<{
    name: string;
    description: string;
    image?: string;
    image_photographer?: string;
    image_photographer_url?: string;
    image_source?: string;
    latitude: number;
    longitude: number;
  }>;
}
```

### Delete Attraction

- Method: DELETE
- URL: `/api/travel-notes/:noteId/attractions/:id`
- Parameters:
  - Required:
    - `noteId` (travel note UUID in URL)
    - `id` (attraction UUID in URL)

## 3. Types Used

```typescript
// Command Types
interface AttractionBulkCreateCommand {
  attractions: CreateAttractionCommand[];
}

interface CreateAttractionCommand {
  name: string;
  description: string;
  image?: string | null;
  image_photographer?: string | null;
  image_photographer_url?: string | null;
  image_source?: string | null;
  latitude: number;
  longitude: number;
}

// Response Types
interface AttractionBulkCreateResponseDTO {
  attractions: AttractionDTO[];
}

interface AttractionDTO {
  id: string;
  name: string;
  description: string;
  image: ImageDTO | null;
  latitude: number;
  longitude: number;
  created_at: string;
}
```

## 4. Data Flow

### Add Attractions

1. Middleware authenticates request
2. Validate travel note existence and ownership
3. Validate attraction data
4. Create attractions in database
5. Return created attractions

### Delete Attraction

1. Middleware authenticates request
2. Validate travel note existence and ownership
3. Validate attraction existence
4. Delete attraction
5. Return 204 No Content

## 5. Security Considerations

### Authentication & Authorization

- Use Supabase middleware for authentication
- Verify user ownership of travel note
- Implement RLS policies for attractions table

### Input Validation

- Sanitize all string inputs
- Validate coordinate ranges:
  - Latitude: -90 to 90
  - Longitude: -180 to 180
- Validate URLs for image fields
- Implement request size limits

### Rate Limiting

- Implement rate limiting per user
- Set reasonable limits for bulk creation

## 6. Error Handling

### HTTP Status Codes

- 201: Successful creation
- 204: Successful deletion
- 400: Invalid input data
  - Invalid coordinates
  - Missing required fields
  - Invalid URLs
- 401: Unauthorized
  - Missing authentication
  - Invalid token
- 403: Access denied
  - User doesn't own note
- 404: Not found
  - Note not found
  - Attraction not found
- 500: Server error
  - Database errors
  - Unexpected errors

### Error Response Format

```typescript
interface APIErrorResponse {
  message: string;
  code: string;
}
```

## 7. Performance Considerations

### Database Operations

- Use bulk insert for attractions
- Implement proper indexes:
  - travel_note_id
  - created_at
- Consider pagination for large datasets

### Caching

- Cache travel note ownership checks
- Cache frequently accessed attractions

## 8. Implementation Steps

### 1. Database Setup

1. Verify indexes on attractions table
2. Implement RLS policies
3. Create database functions for bulk operations

### 2. Service Layer

1. Create/update TravelNoteService

```typescript
class TravelNoteService {
  async addAttractions(noteId: string, attractions: CreateAttractionCommand[]): Promise<AttractionDTO[]>;

  async removeAttraction(noteId: string, attractionId: string): Promise<void>;
}
```

### 3. Validation Layer

1. Create validation schemas

```typescript
const createAttractionSchema = {
  name: string().required(),
  description: string().required(),
  latitude: number().min(-90).max(90),
  longitude: number().min(-180).max(180),
  image: string().url().optional(),
  // ... other fields
};
```

### 4. API Endpoints

1. Create POST endpoint

```typescript
export const POST: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;
  const { attractions } = await request.json();
  // ... implementation
};
```

2. Create DELETE endpoint

```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  const { noteId, id } = params;
  // ... implementation
};
```

### 5. Error Handling

1. Implement custom error types
2. Add error logging
3. Create error response helpers

### 6. Testing

1. Unit tests for validation
2. Integration tests for endpoints
3. Performance tests for bulk operations

### 7. Documentation

1. Update API documentation
2. Add JSDoc comments
3. Update README.md

### 8. Deployment

1. Review database migrations
2. Deploy to staging
3. Conduct security review
4. Deploy to production
