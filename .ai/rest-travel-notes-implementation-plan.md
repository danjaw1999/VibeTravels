# API Endpoint Implementation Plan: Travel Notes CRUD Operations

## 1. Przegląd punktu końcowego
Implementacja endpointów do zarządzania pojedynczą notatką podróży (GET, PATCH, DELETE).
Endpointy zapewniają dostęp do szczegółów notatki wraz z powiązanymi atrakcjami, z uwzględnieniem
kontroli dostępu opartej na własności i statusie publicznym.

## 2. Szczegóły żądania

### GET /api/travel-notes/:id
- Metoda: GET
- Parametry ścieżki:
  - id: UUID notatki
- Nagłówki:
  - Authorization: Bearer token (JWT z Supabase)

### PATCH /api/travel-notes/:id
- Metoda: PATCH
- Parametry ścieżki:
  - id: UUID notatki
- Nagłówki:
  - Authorization: Bearer token (JWT z Supabase)
  - Content-Type: application/json
- Body:
  ```typescript
  {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }
  ```

### DELETE /api/travel-notes/:id
- Metoda: DELETE
- Parametry ścieżki:
  - id: UUID notatki
- Nagłówki:
  - Authorization: Bearer token (JWT z Supabase)

## 3. Wykorzystywane typy

```typescript
// src/types.ts

export interface TravelNoteUpdateCommand {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// Istniejące typy
export interface TravelNoteDTO {
  id: UUID;
  userId: UUID;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  attractions: AttractionDTO[];
}

// Schema walidacji
export const travelNoteUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  isPublic: z.boolean().optional()
});
```

## 4. Przepływ danych

### GET /api/travel-notes/:id
1. Walidacja parametru id (UUID)
2. Pobranie użytkownika z kontekstu Supabase
3. Pobranie notatki z atrakcjami przez serwis
4. Sprawdzenie uprawnień dostępu (właściciel lub notatka publiczna)
5. Mapowanie do DTO i zwrócenie odpowiedzi

### PATCH /api/travel-notes/:id
1. Walidacja parametru id (UUID)
2. Pobranie i walidacja body przez Zod schema
3. Pobranie użytkownika z kontekstu Supabase
4. Sprawdzenie uprawnień (tylko właściciel)
5. Aktualizacja notatki przez serwis
6. Mapowanie do DTO i zwrócenie odpowiedzi

### DELETE /api/travel-notes/:id
1. Walidacja parametru id (UUID)
2. Pobranie użytkownika z kontekstu Supabase
3. Sprawdzenie uprawnień (tylko właściciel)
4. Usunięcie notatki przez serwis
5. Zwrócenie statusu 204

## 5. Względy bezpieczeństwa

### Autoryzacja
```sql
-- RLS Policies dla travel_notes
ALTER TABLE travel_notes ENABLE ROW LEVEL SECURITY;

-- Policy dla SELECT
CREATE POLICY "Users can view own or public travel notes"
ON travel_notes FOR SELECT
USING (
  is_public = true OR 
  auth.uid() = user_id
);

-- Policy dla UPDATE/DELETE
CREATE POLICY "Users can modify own travel notes"
ON travel_notes FOR ALL
USING (auth.uid() = user_id);
```

### Walidacja danych
- Sanityzacja wszystkich danych wejściowych
- Walidacja typów przez Zod
- Sprawdzanie uprawnień przed każdą operacją
- Bezpieczne zapytania przez Supabase Client

## 6. Obsługa błędów

```typescript
// Klasy błędów
export class TravelNoteNotFoundError extends Error {
  constructor(id: string) {
    super(`Travel note with id ${id} not found`);
  }
}

export class TravelNoteAccessDeniedError extends Error {
  constructor() {
    super('Access to this travel note is denied');
  }
}

// Mapowanie błędów na odpowiedzi HTTP
const errorHandler = (error: Error) => {
  if (error instanceof TravelNoteNotFoundError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 404 }
    );
  }
  if (error instanceof TravelNoteAccessDeniedError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 403 }
    );
  }
  // ... inne przypadki
};
```

## 7. Wydajność

### Optymalizacja zapytań
```sql
-- Indeks dla szybkiego wyszukiwania notatek
CREATE INDEX IF NOT EXISTS travel_notes_user_public_idx 
ON travel_notes(user_id, is_public);

-- Indeks dla relacji z atrakcjami
CREATE INDEX IF NOT EXISTS attractions_travel_note_idx 
ON attractions(travel_note_id);
```

### Strategie
- Eager loading atrakcji przez `select('*, attractions(*)')`
- Cachowanie odpowiedzi dla publicznych notatek
- Optymalizacja zapytań przez indeksy

## 8. Kroki implementacji

1. Przygotowanie typów i schematów:
   ```bash
   touch src/lib/schemas/travel-note-update.schema.ts
   ```

2. Rozszerzenie serwisu:
   ```typescript
   // src/lib/services/travel-note.service.ts
   class TravelNoteService {
     async getTravelNote(id: string, userId?: string): Promise<TravelNoteDTO>;
     async updateTravelNote(id: string, userId: string, command: TravelNoteUpdateCommand): Promise<TravelNoteDTO>;
     async deleteTravelNote(id: string, userId: string): Promise<void>;
   }
   ```

3. Implementacja endpointów:
   ```bash
   mkdir -p src/pages/api/travel-notes/[id]
   touch src/pages/api/travel-notes/[id]/index.ts
   ```

4. Dodanie migracji dla RLS i indeksów:
   ```bash
   touch supabase/migrations/[timestamp]_add_travel_notes_rls_and_indexes.sql
   ```

5. Implementacja testów:
   ```bash
   touch src/pages/api/__tests__/travel-notes-[id].test.ts
   ```

6. Dokumentacja API:
   ```bash
   touch docs/api/travel-notes-crud.md
   ```

7. Testy wydajnościowe:
   - Scenariusze testowe dla różnych rozmiarów danych
   - Testy obciążeniowe dla concurrent requests
   - Monitoring czasu odpowiedzi

8. Wdrożenie:
   - Code review
   - Testy na środowisku staging
   - Monitoring po wdrożeniu 