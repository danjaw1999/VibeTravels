# API Endpoint Implementation Plan: Register User

## 1. Przegląd punktu końcowego
Endpoint rejestracji użytkownika wykorzystujący Supabase Auth. Przyjmuje dane rejestracyjne (email, hasło i opcjonalny opis profilu), tworzy nowe konto użytkownika i zwraca podstawowe dane użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: POST
- **Ścieżka**: `/api/auth/register`
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
  ```typescript
  {
    email: string,    // Adres email użytkownika
    password: string, // Hasło użytkownika
    profileDescription?: string // Opcjonalny opis profilu
  }
  ```

## 3. Wykorzystywane typy

### Command Models
```typescript
// src/lib/schemas/auth.schema.ts
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  profileDescription: z.string().max(1000).optional()
});

export type RegisterCommand = z.infer<typeof registerSchema>;
```

### DTOs
```typescript
// src/types.ts
export interface UserDTO {
  id: UUID;
  email: string;
  profileDescription: string | null;
  createdAt: ISODateTime;
}
```

## 4. Przepływ danych
1. Walidacja danych wejściowych przez Zod schema
2. Przekazanie danych do AuthService
3. Wywołanie Supabase Auth API dla rejestracji
4. Utworzenie profilu użytkownika w tabeli users
5. Mapowanie odpowiedzi na UserDTO
6. Zwrócenie odpowiedzi do klienta

## 5. Względy bezpieczeństwa
- Wykorzystanie HTTPS (wymagane przez Supabase)
- Walidacja danych wejściowych przez Zod
- Bezpieczne przechowywanie hashy haseł (obsługiwane przez Supabase)
- Automatyczna ochrona przed atakami CSRF (Supabase)
- Automatyczna ochrona przed SQL Injection (Supabase)
- Rate limiting na poziomie API (do implementacji)
- Sanityzacja danych wejściowych przed zapisem do bazy

## 6. Obsługa błędów
- **400 Bad Request**:
  - Nieprawidłowy format email
  - Hasło nie spełnia wymagań
  - Brakujące wymagane pola
  - Opis profilu przekracza limit znaków
- **409 Conflict**:
  - Email już istnieje w systemie
- **500 Internal Server Error**:
  - Błąd serwera Supabase
  - Błąd tworzenia profilu użytkownika
  - Błąd mapowania danych

## 7. Rozważania dotyczące wydajności
- Cachowanie odpowiedzi Supabase Auth
- Implementacja rate limitingu
- Monitorowanie czasu odpowiedzi
- Logowanie błędów dla analizy wydajności
- Asynchroniczne wysyłanie emaili weryfikacyjnych

## 8. Etapy wdrożenia

### 1. Przygotowanie typów i schematów
1. Utworzenie `src/lib/schemas/auth.schema.ts`
2. Aktualizacja `src/types.ts` o nowe DTO
3. Utworzenie testów dla schematów

### 2. Implementacja AuthService
```typescript
// src/lib/services/auth.service.ts
export class AuthService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async register(command: RegisterCommand): Promise<UserDTO> {
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: command.email,
      password: command.password,
      options: {
        data: {
          profileDescription: command.profileDescription
        }
      }
    });

    if (authError) throw authError;

    // Create user profile
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: command.email,
        profile_description: command.profileDescription
      })
      .select()
      .single();

    if (userError) throw userError;

    return {
      id: userData.id,
      email: userData.email,
      profileDescription: userData.profile_description,
      createdAt: userData.created_at
    };
  }
}
```

### 3. Implementacja endpointu
```typescript
// src/pages/api/auth/register.ts
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const command = registerSchema.parse(body);
    
    const service = new AuthService(locals.supabase);
    const user = await service.register(command);

    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input data',
          details: error.errors
        }),
        { status: 400 }
      );
    }

    if (error instanceof AuthError && error.message.includes('already exists')) {
      return new Response(
        JSON.stringify({ error: 'Email already exists' }),
        { status: 409 }
      );
    }

    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
```

### 4. Implementacja testów
1. Testy jednostkowe dla AuthService
2. Testy integracyjne dla endpointu
3. Testy walidacji schematów

### 5. Dokumentacja
1. Aktualizacja Swagger/OpenAPI
2. Aktualizacja README
3. Dodanie przykładów użycia

### 6. Wdrożenie
1. Code review
2. Testy na środowisku staging
3. Wdrożenie na produkcję
4. Monitoring po wdrożeniu 