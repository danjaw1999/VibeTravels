# API Endpoint Implementation Plan: List Travel Notes

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania listy notatek podróży z możliwością filtrowania, wyszukiwania i paginacji. Zwraca zarówno publiczne notatki jak i prywatne notatki zalogowanego użytkownika. Opcjonalnie może zawierać powiązane atrakcje.

## 2. Szczegóły żądania
- **Metoda HTTP**: GET
- **Ścieżka**: `/api/travel-notes`
- **Parametry Query**:
  ```typescript
  {
    page?: number;      // Numer strony (domyślnie: 1)
    limit?: number;     // Liczba wyników na stronę (domyślnie: 10)
    search?: string;    // Wyszukiwanie w name i description
    isPublic?: boolean; // Filtrowanie po statusie publicznym
    includeAttractions?: boolean; // Dołączanie atrakcji (domyślnie: true)
  }
  ```

## 3. Wykorzystywane typy
```typescript
// src/types.ts

// Parametry zapytania
export interface TravelNoteQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isPublic?: boolean;
  includeAttractions?: boolean;
}

// Schema walidacji
export const travelNoteQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  includeAttractions: z.coerce.boolean().default(true)
});

// Response DTO
export interface TravelNoteListResponseDTO {
  items: TravelNoteDTO[];
  total: number;
  page: number;
  limit: number;
}
```

## 4. Przepływ danych
1. Walidacja parametrów zapytania:
   ```typescript
   const params = travelNoteQuerySchema.parse(
     Object.fromEntries(new URL(request.url).searchParams)
   );
   ```

2. Pobranie zalogowanego użytkownika:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   ```

3. Budowanie zapytania bazodanowego:
   ```typescript
   let query = supabase
     .from('travel_notes')
     .select('*, attractions(*)', { count: 'exact' });

   // Filtrowanie publicznych i prywatnych notatek
   query = query.or(`is_public.eq.true,user_id.eq.${user?.id}`);

   // Wyszukiwanie
   if (params.search) {
     query = query.or(
       `name.ilike.%${params.search}%,description.ilike.%${params.search}%`
     );
   }

   // Filtrowanie po statusie publicznym
   if (params.isPublic !== undefined) {
     query = query.eq('is_public', params.isPublic);
   }

   // Paginacja
   query = query
     .range(
       (params.page - 1) * params.limit,
       params.page * params.limit - 1
     )
     .order('created_at', { ascending: false });
   ```

4. Mapowanie wyników:
   ```typescript
   const { data, count, error } = await query;
   
   return {
     items: data.map(mapToDTO),
     total: count ?? 0,
     page: params.page,
     limit: params.limit
   };
   ```

## 5. Względy bezpieczeństwa
1. Uwierzytelnianie:
   - Weryfikacja tokena JWT
   - Obsługa sesji przez Supabase Auth

2. Autoryzacja:
   - RLS policy dla publicznych notatek:
     ```sql
     CREATE POLICY "Anyone can view public travel notes"
     ON travel_notes FOR SELECT
     USING (is_public = true);
     ```
   - RLS policy dla prywatnych notatek:
     ```sql
     CREATE POLICY "Users can view own travel notes"
     ON travel_notes FOR SELECT
     TO authenticated
     USING (auth.uid() = user_id);
     ```

3. Walidacja danych:
   - Sanityzacja parametrów wyszukiwania
   - Ograniczenie wielkości odpowiedzi
   - Walidacja typów przez Zod

## 6. Obsługa błędów
1. Błędy walidacji (400):
   ```typescript
   if (error instanceof z.ZodError) {
     return new Response(
       JSON.stringify({
         error: 'Invalid query parameters',
         details: error.errors
       }),
       { status: 400 }
     );
   }
   ```

2. Błędy autoryzacji (401):
   ```typescript
   if (!user) {
     return new Response(
       JSON.stringify({ error: 'Unauthorized' }),
       { status: 401 }
     );
   }
   ```

3. Błędy bazy danych (500):
   ```typescript
   if (error) {
     console.error('Database error:', error);
     return new Response(
       JSON.stringify({ error: 'Internal server error' }),
       { status: 500 }
     );
   }
   ```

## 7. Wydajność
1. Optymalizacja bazy danych:
   ```sql
   -- Indeks dla wyszukiwania full-text
   CREATE INDEX travel_notes_search_idx 
   ON travel_notes USING gin(
     to_tsvector('polish', name || ' ' || description)
   );

   -- Indeks dla filtrowania
   CREATE INDEX travel_notes_public_user_idx 
   ON travel_notes(is_public, user_id);
   ```

2. Optymalizacja zapytań:
   - Eager loading dla atrakcji
   - Paginacja po stronie bazy danych
   - Limit wielkości odpowiedzi

3. Cachowanie:
   - Implementacja cache dla częstych zapytań
   - Invalidacja cache przy zmianach

## 8. Kroki implementacji

1. Przygotowanie typów i schematów:
   ```bash
   touch src/lib/schemas/travel-note-query.schema.ts
   ```

2. Implementacja endpointu:
   ```bash
   touch src/pages/api/travel-notes/index.ts
   ```

3. Rozszerzenie serwisu:
   ```typescript
   // src/lib/services/travel-note.service.ts
   class TravelNoteService {
     async listTravelNotes(
       params: TravelNoteQueryParams,
       userId?: string
     ): Promise<TravelNoteListResponseDTO>;
   }
   ```

4. Implementacja testów:
   ```bash
   touch src/pages/api/__tests__/travel-notes.test.ts
   ```

5. Dodanie indeksów bazodanowych:
   ```bash
   touch supabase/migrations/[timestamp]_add_travel_notes_indexes.sql
   ```

6. Dokumentacja API:
   ```bash
   touch docs/api/travel-notes.md
   ```

7. Testy wydajnościowe:
   - Scenariusze testowe dla różnych rozmiarów danych
   - Testy obciążeniowe dla concurrent requests
   - Monitoring czasu odpowiedzi

8. Wdrożenie:
   - Code review
   - Testy na środowisku staging
   - Monitoring po wdrożeniu 