# API Endpoint Implementation Plan: Add Attractions to Travel Note

## 1. Przegląd punktu końcowego

Endpoint umożliwia dodawanie jednej lub więcej atrakcji do istniejącej notatki podróżniczej. Obsługuje operacje wsadowe, pozwalając na dodanie wielu atrakcji w jednym żądaniu. Wymaga uwierzytelnienia i autoryzacji, zapewniając że tylko właściciel notatki może dodawać do niej atrakcje.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: `/api/travel-notes/:id/attractions`
- Parametry URL:
  - Wymagane: `id` (UUID notatki podróżniczej)
- Request Body:
  ```typescript
  {
    attractions: {
      name: string;
      description?: string;
      image?: string;
      latitude: number;
      longitude: number;
    }[]
  }
  ```

## 3. Wykorzystywane typy

```typescript
// Istniejące typy z types.ts
import type {
  AttractionCreateCommand,
  AttractionBulkCreateCommand,
  AttractionBulkCreateResponseDTO,
  AttractionDTO,
  UUID,
} from "../types";

// Nowe typy do zdefiniowania
interface AddAttractionsSchema {
  attractions: {
    name: string;
    description?: string;
    image?: string;
    latitude: number;
    longitude: number;
  }[];
}
```

## 4. Szczegóły odpowiedzi

- Status: 201 Created
- Body:
  ```typescript
  {
    attractions: {
      id: string;
      name: string;
      description: string | null;
      image: string | null;
      latitude: number;
      longitude: number;
      createdAt: string;
    }
    [];
  }
  ```

## 5. Przepływ danych

1. Walidacja żądania i parametrów
2. Uwierzytelnienie użytkownika (Supabase auth)
3. Pobranie i weryfikacja notatki podróżniczej
4. Autoryzacja dostępu do notatki
5. Walidacja danych atrakcji
6. Transakcyjna operacja dodawania atrakcji
7. Zwrócenie utworzonych atrakcji

## 6. Względy bezpieczeństwa

1. Uwierzytelnianie:
   - Wykorzystanie Supabase auth middleware
   - Weryfikacja tokena JWT
2. Autoryzacja:
   - Sprawdzenie właściciela notatki
   - Wykorzystanie Row Level Security (RLS) w Supabase
3. Walidacja danych:
   - Sanityzacja wszystkich danych wejściowych
   - Walidacja formatów URL dla obrazów
   - Walidacja zakresów współrzędnych geograficznych
4. Zabezpieczenia bazy danych:
   - Wykorzystanie prepared statements
   - Transakcyjne operacje bazodanowe
   - Ograniczenia integralności referencyjnej

## 7. Obsługa błędów

1. 400 Bad Request:
   - Nieprawidłowy format UUID notatki
   - Brak wymaganych pól
   - Nieprawidłowe współrzędne geograficzne
   - Nieprawidłowy format URL obrazu
2. 401 Unauthorized:
   - Brak tokena uwierzytelniającego
   - Nieważny token
3. 403 Forbidden:
   - Brak uprawnień do notatki
4. 404 Not Found:
   - Notatka nie istnieje
5. 500 Internal Server Error:
   - Błędy bazy danych
   - Nieoczekiwane błędy serwera

## 8. Rozważania dotyczące wydajności

1. Optymalizacja bazy danych:
   - Indeksy na travel_note_id w tabeli attractions
   - Indeksy na współrzędnych geograficznych
2. Walidacja danych:
   - Ograniczenie rozmiaru tablicy attractions
   - Ograniczenie rozmiaru URL obrazów
3. Przetwarzanie wsadowe:
   - Wykorzystanie bulk insert dla wielu atrakcji
   - Transakcyjne przetwarzanie całego żądania

## 9. Etapy wdrożenia

1. Konfiguracja i przygotowanie:

   ```typescript
   // src/lib/schemas/attractions.ts
   export const addAttractionsSchema = z.object({
     attractions: z
       .array(
         z.object({
           name: z.string().min(1).max(255),
           description: z.string().optional(),
           image: z.string().url().optional(),
           latitude: z.number().min(-90).max(90),
           longitude: z.number().min(-180).max(180),
         })
       )
       .min(1)
       .max(50),
   });
   ```

2. Implementacja serwisu:

   ```typescript
   // src/lib/services/attractions.service.ts
   export class AttractionsService {
     constructor(private supabase: SupabaseClient) {}

     async addAttractions(
       noteId: UUID,
       userId: UUID,
       attractions: AttractionCreateCommand[]
     ): Promise<AttractionDTO[]> {
       // Implementacja logiki
     }
   }
   ```

3. Implementacja endpointu:

   ```typescript
   // src/pages/api/travel-notes/[id]/attractions.ts
   export const POST: APIRoute = async ({ params, request, locals }) => {
     // Implementacja endpointu
   };
   ```

4. Testy:

   - Testy jednostkowe serwisu
   - Testy integracyjne endpointu
   - Testy wydajnościowe dla operacji wsadowych
   - Testy bezpieczeństwa

5. Dokumentacja:
   - Aktualizacja dokumentacji API
   - Przykłady użycia
   - Opis obsługi błędów
