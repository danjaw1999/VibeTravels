# REST API Plan for VibeTravels

## 1. Resources

### Users
- Maps to `users` table
- Represents user accounts and profiles
- Contains authentication and profile information

### TravelNotes
- Maps to `travel_notes` table
- Represents travel plans and notes
- Contains destination and description information
- Can be public or private

### Attractions
- Maps to `attractions` table
- Represents points of interest within travel notes
- Contains location and descriptive information
- Always associated with a travel note

## 2. Endpoints

### Authentication

#### Register User
- **Method**: POST
- **Path**: `/api/auth/register`
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "profileDescription": "string?"
  }
  ```
- **Response Body** (201 Created):
  ```json
  {
    "id": "uuid",
    "email": "string",
    "profileDescription": "string?",
    "createdAt": "string"
  }
  ```
- **Error Codes**:
  - 400: Invalid input data
  - 409: Email already exists

#### Login
- **Method**: POST
- **Path**: `/api/auth/login`
- **Description**: Authenticate user and get access token
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response Body** (200 OK):
  ```json
  {
    "accessToken": "string",
    "user": {
      "id": "uuid",
      "email": "string",
      "profileDescription": "string?"
    }
  }
  ```
- **Error Codes**:
  - 401: Invalid credentials

### User Profile

#### Get Profile
- **Method**: GET
- **Path**: `/api/users/me`
- **Description**: Get current user's profile
- **Response Body** (200 OK):
  ```json
  {
    "id": "uuid",
    "email": "string",
    "profileDescription": "string?",
    "createdAt": "string"
  }
  ```
- **Error Codes**:
  - 401: Unauthorized

#### Update Profile
- **Method**: PATCH
- **Path**: `/api/users/me`
- **Description**: Update current user's profile
- **Request Body**:
  ```json
  {
    "profileDescription": "string?"
  }
  ```
- **Response Body** (200 OK):
  ```json
  {
    "id": "uuid",
    "email": "string",
    "profileDescription": "string?",
    "updatedAt": "string"
  }
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 400: Invalid input data

### Travel Notes

#### List Travel Notes
- **Method**: GET
- **Path**: `/api/travel-notes`
- **Description**: Get list of travel notes (public ones and user's private ones)
- **Query Parameters**:
  - page: number (default: 1)
  - limit: number (default: 10)
  - search: string? (search in name and description)
  - isPublic: boolean?
  - includeAttractions: boolean? (default: true)
- **Response Body** (200 OK):
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "userId": "uuid",
        "name": "string",
        "description": "string",
        "isPublic": "boolean",
        "createdAt": "string",
        "updatedAt": "string",
        "attractions": [
          {
            "id": "uuid",
            "name": "string",
            "description": "string?",
            "image": "string?",
            "latitude": "number",
            "longitude": "number",
            "createdAt": "string"
          }
        ]
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```

#### Create Travel Note
- **Method**: POST
- **Path**: `/api/travel-notes`
- **Description**: Create a new travel note
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "isPublic": "boolean?"
  }
  ```
- **Response Body** (201 Created):
  ```json
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "string",
    "description": "string",
    "isPublic": "boolean",
    "createdAt": "string",
    "attractions": []
  }
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 400: Invalid input data

#### Get Travel Note
- **Method**: GET
- **Path**: `/api/travel-notes/:id`
- **Description**: Get a specific travel note
- **Response Body** (200 OK):
  ```json
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "string",
    "description": "string",
    "isPublic": "boolean",
    "createdAt": "string",
    "updatedAt": "string",
    "attractions": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string?",
        "image": "string?",
        "latitude": "number",
        "longitude": "number",
        "createdAt": "string"
      }
    ]
  }
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 404: Note not found
  - 403: Access denied (private note of another user)

#### Update Travel Note
- **Method**: PATCH
- **Path**: `/api/travel-notes/:id`
- **Description**: Update a travel note
- **Request Body**:
  ```json
  {
    "name": "string?",
    "description": "string?",
    "isPublic": "boolean?"
  }
  ```
- **Response Body** (200 OK):
  ```json
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "string",
    "description": "string",
    "isPublic": "boolean",
    "updatedAt": "string",
    "attractions": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string?",
        "image": "string?",
        "latitude": "number",
        "longitude": "number",
        "createdAt": "string"
      }
    ]
  }
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 404: Note not found
  - 403: Access denied
  - 400: Invalid input data

#### Delete Travel Note
- **Method**: DELETE
- **Path**: `/api/travel-notes/:id`
- **Description**: Delete a travel note
- **Response**: 204 No Content
- **Error Codes**:
  - 401: Unauthorized
  - 404: Note not found
  - 403: Access denied

### Attractions

#### Generate Attractions
- **Method**: POST
- **Path**: `/api/travel-notes/:id/attractions/generate`
- **Description**: Generate attractions using AI based on travel note
- **Response Body** (200 OK):
  ```json
  {
    "suggestions": [
      {
        "name": "string (includes English name in parentheses)",
        "description": "string (detailed description including: uniqueness, visiting info, ticket prices, facilities)",
        "latitude": "number",
        "longitude": "number",
        "image": {
          "url": "string",
          "photographer": "string",
          "photographerUrl": "string",
          "source": "string"
        } | null,
        "estimatedPrice": "string (detailed pricing info including normal/reduced prices and special conditions)"
      }
    ]
  }
  ```
- **Description Details**:
  - Name includes both Polish and English versions
  - Description contains:
    - What makes the place unique (2-3 sentences)
    - Practical visiting information (duration, best hours, reservations)
    - Ticket information (normal/reduced prices, free entry conditions)
    - Additional facilities (restaurants, souvenir shops, accessibility)
  - Estimated price includes:
    - Normal and reduced ticket prices
    - Free entry conditions (age limits, special days)
    - Additional pricing information
- **Error Codes**:
  - 401: Unauthorized
  - 404: Note not found
  - 403: Access denied
  - 429: Too many requests (Pexels API rate limit)

#### Add Attractions
- **Method**: POST
- **Path**: `/api/travel-notes/:id/attractions`
- **Description**: Add attractions to a travel note
- **Request Body**:
  ```json
  {
    "attractions": [
      {
        "name": "string",
        "description": "string",
        "image": "string?",
        "image_photographer": "string?",
        "image_photographer_url": "string?",
        "image_source": "string?",
        "latitude": "number",
        "longitude": "number"
      }
    ]
  }
  ```
- **Response Body** (201 Created):
  ```json
  {
    "attractions": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "image": {
          "url": "string",
          "photographer": "string",
          "photographerUrl": "string",
          "source": "string"
        } | null,
        "latitude": "number",
        "longitude": "number",
        "createdAt": "string"
      }
    ]
  }
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 404: Note not found
  - 403: Access denied
  - 400: Invalid input data

#### Delete Attraction
- **Method**: DELETE
- **Path**: `/api/travel-notes/:noteId/attractions/:id`
- **Description**: Remove an attraction from a travel note
- **Response**: 204 No Content
- **Error Codes**:
  - 401: Unauthorized
  - 404: Note or attraction not found
  - 403: Access denied

## 3. Authentication and Authorization

### Authentication
- Uses Supabase authentication system
- JWT-based authentication
- Tokens provided in Authorization header: `Bearer <token>`
- Token refresh mechanism handled by Supabase client

### Authorization
- Row Level Security (RLS) policies enforced by Supabase
- API endpoints check user permissions before operations
- Travel notes access controlled by `is_public` flag and ownership
- Attractions inherit access control from parent travel note

## 4. Validation and Business Logic

### User Validation
- Email must be valid and unique
- Password must meet security requirements (min length, complexity)
- Profile description is optional

### Travel Note Validation
- Name is required and cannot be empty
- Description is required and cannot be empty
- `is_public` defaults to true if not specified

### Attraction Validation
- Name is required and cannot be empty
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Image URL must be valid if provided

### Business Logic
- AI generation rate limited to prevent abuse
- Cascading deletes handled by database constraints
- Automatic timestamp updates for created_at and updated_at
- Google Maps links generated from latitude/longitude data
- Public/private visibility controlled at travel note level 