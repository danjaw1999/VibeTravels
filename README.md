# VibeTravels (MVP)

## 1. Project Name
VibeTravels (MVP)

## 2. Project Description
VibeTravels is a travel planning application that leverages AI to transform simple travel notes into detailed itineraries. The app enables users to create, manage, and review travel notes, maintain a basic user profile with travel preferences, and generate personalized recommendations for attractions in a selected destination. An integral feature is the integration of AI, which converts user-input destinations and descriptions into a list of attractions complete with details and Google Maps links.

## 3. Tech Stack

**Frontend**
- Astro 5: For building fast and efficient web pages with minimal JavaScript.
- React 19: Provides interactivity for dynamic components.
- TypeScript 5: Enables static typing and improved IDE support.
- Tailwind CSS 4: For convenient and responsive styling.
- Shadcn/ui: A React component library for UI elements.

**Backend**
- Supabase: A comprehensive Backend-as-a-Service offering a PostgreSQL database, SDKs in various languages, and built-in user authentication.

**AI**
- Openrouter.ai: Integrates with multiple AI models (OpenAI, Anthropic, Google, etc.) to provide efficient and cost-effective AI services with configurable API key limits.

**CI/CD & Hosting**
- GitHub Actions: For constructing CI/CD pipelines.
- DigitalOcean: Hosts the application using Docker images.

## 4. Getting Started Locally

### Prerequisites
- Node.js (version specified in `.nvmrc`: 22.14.0)
- npm or yarn package manager

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the Development Server
Start the development server with:
```bash
npm run dev
# or
yarn dev
```
Access the application at [http://localhost:3000](http://localhost:3000) (or the port specified by Astro).

## 5. Available Scripts

- `npm run dev` or `yarn dev`: Starts the Astro development server.
- `npm run build` or `yarn build`: Builds the project for production.
- `npm run preview` or `yarn preview`: Serves the production build locally.
- `npm run lint` or `yarn lint`: Runs ESLint to check for code issues.
- `npm run lint:fix` or `yarn lint:fix`: Automatically fixes linting issues.
- `npm run format` or `yarn format`: Formats code using Prettier.

## 6. Project Scope

**Included:**
- CRUD operations for managing travel notes.
- Listing and searching itineraries and attractions.
- User registration and login to associate notes with user accounts.
- A basic user profile allowing users to add a personal description and travel preferences.
- AI integration that converts travel notes (destination and description) into a list of attractions. Each attraction includes a name, description (with optional entrance fee details), an image URL, and localization (latitude and longitude) to generate Google Maps links.
- A separate endpoint for adding selected attractions to an itinerary.

**Excluded:**
- Sharing travel plans between users.
- Advanced multimedia handling (e.g., in-depth image analysis).
- Advanced trip scheduling and logistics planning.
- Full integration with Google Maps API (currently, only link generation is supported).

## 7. Project Status

The project is in the MVP stage and under active development. Feedback on usability, performance, and feature enhancements is welcome.

## 8. License

This project is licensed under the MIT License.

## Features

- Create and manage travel notes
- Get AI-generated attraction suggestions based on your travel plans
- Add attractions to your travel notes
- Share travel plans with others

## API Examples

### Generate Attraction Suggestions

```typescript
// Get suggestions based on a travel note
const response = await fetch(`/api/travel-notes/${noteId}/attractions/generate?limit=5`);
const { suggestions } = await response.json();

// Get suggestions excluding certain attractions
const excludeList = ['Eiffel Tower', 'Louvre'].join(',');
const response = await fetch(
  `/api/travel-notes/${noteId}/attractions/generate?exclude=${excludeList}`
);
const { suggestions } = await response.json();
```

### Add Attractions to Travel Note

```typescript
// Add multiple attractions to a travel note
const attractions = [
  {
    name: 'Eiffel Tower',
    description: 'Iconic iron lattice tower on the Champ de Mars',
    latitude: 48.8584,
    longitude: 2.2945
  },
  {
    name: 'Louvre Museum',
    description: 'World\'s largest art museum and historic monument',
    latitude: 48.8606,
    longitude: 2.3376
  }
];

const response = await fetch(`/api/travel-notes/${noteId}/attractions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ attractions })
});

const { attractions: createdAttractions } = await response.json();
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Environment Variables

```bash
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION_ID=your_openai_org_id  # Optional
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

### Testing

The project includes unit tests and integration tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## API Endpoints

### Travel Notes

#### GET /api/travel-notes/:id
Pobiera szczegóły notatki podróży o podanym ID.

**Parametry URL:**
- `id` (UUID) - ID notatki podróży

**Odpowiedź:**
- Status: 200 OK
- Body: TravelNoteDTO (szczegóły w dokumentacji Swagger)

#### PATCH /api/travel-notes/:id
Aktualizuje notatkę podróży o podanym ID.

**Parametry URL:**
- `id` (UUID) - ID notatki podróży

**Body:**
```json
{
  "name": "string",       // opcjonalne, min 1 znak, max 255 znaków
  "description": "string", // opcjonalne, min 1 znak
  "isPublic": boolean     // opcjonalne
}
```

**Odpowiedź:**
- Status: 200 OK
- Body: Zaktualizowany TravelNoteDTO

#### DELETE /api/travel-notes/:id
Usuwa notatkę podróży o podanym ID.

**Parametry URL:**
- `id` (UUID) - ID notatki podróży

**Odpowiedź:**
- Status: 204 No Content

### Dokumentacja API

Pełna dokumentacja API jest dostępna w formacie Swagger pod adresem `/api/swagger.json`.

# VibeTravels API Documentation

## Overview
VibeTravels API provides endpoints for managing travel notes and their attractions. The API uses Supabase for authentication and data storage.

## Authentication
All endpoints require authentication using a Supabase JWT token. Include the token in the `Authorization` header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### Travel Notes

#### Create Travel Note
```http
POST /api/travel-notes
```

Request body:
```json
{
  "name": "string",
  "description": "string",
  "isPublic": boolean (optional, defaults to true)
}
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "name": "string",
    "description": "string",
    "isPublic": boolean,
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime",
    "attractions": []
  }
}
```

#### List Travel Notes
```http
GET /api/travel-notes
```

Query parameters:
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `location` (string, optional)
- `isPublic` (boolean, optional)
- `sortBy` (string, optional)
- `sortOrder` ("asc" | "desc", optional)

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "string",
      "description": "string",
      "isPublic": boolean,
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime",
      "attractions": [...]
    }
  ],
  "total": number
}
```

#### Get Travel Note
```http
GET /api/travel-notes/:id
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "name": "string",
    "description": "string",
    "isPublic": boolean,
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime",
    "attractions": [...]
  }
}
```

#### Update Travel Note
```http
PUT /api/travel-notes/:id
```

Request body:
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "isPublic": boolean (optional)
}
```

Response: Same as Get Travel Note

#### Delete Travel Note
```http
DELETE /api/travel-notes/:id
```

Response: 204 No Content

### Attractions

#### Add Attractions to Note
```http
POST /api/travel-notes/:id/attractions
```

Request body:
```json
{
  "attractions": [
    {
      "name": "string",
      "description": "string",
      "image": "string (optional)",
      "imagePhotographer": "string (optional)",
      "imagePhotographerUrl": "string (optional)",
      "imageSource": "string (optional)",
      "latitude": number (-90 to 90),
      "longitude": number (-180 to 180)
    }
  ]
}
```

Response:
```json
{
  "data": {
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
        "latitude": number,
        "longitude": number,
        "createdAt": "ISO datetime"
      }
    ]
  }
}
```

#### Remove Attraction from Note
```http
DELETE /api/travel-notes/:noteId/attractions/:id
```

Response: 204 No Content

## Error Responses

All error responses follow this format:
```json
{
  "message": "string",
  "code": "string"
}
```

Common error codes:
- 400: Invalid input data
- 401: Unauthorized
- 403: Access denied
- 404: Resource not found
- 500: Server error

## Rate Limiting

The API implements rate limiting per user:
- Bulk attraction creation: 50 attractions per request
- Maximum 100 requests per minute per user

## Performance Considerations

- Ownership verification is cached for 5 minutes
- Bulk operations are optimized for performance
- Database queries use proper indexes
- Response pagination is implemented for large datasets

## Security

- All endpoints require authentication
- Row Level Security (RLS) policies ensure users can only access their own data
- Input validation and sanitization is implemented
- Secure password hashing for user accounts
- API keys and sensitive data are never exposed
