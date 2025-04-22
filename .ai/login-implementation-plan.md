# API Endpoint Implementation Plan: Login Endpoint

## 1. Przegląd punktu końcowego

Endpoint logowania użytkownika wykorzystujący Supabase Auth. Przyjmuje dane logowania (email i hasło), weryfikuje je i zwraca token dostępu wraz z podstawowymi danymi użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Ścieżka**: `/api/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
  ```typescript
  {
    email: string,    // Adres email użytkownika
    password: string  // Hasło użytkownika
  }
  ```

## 3. Wykorzystywane typy

### Command Models

```typescript
// src/lib/schemas/auth.schema.ts
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginCommand = z.infer<typeof loginSchema>;
```

### DTOs

```typescript
// src/types.ts
export interface AuthResponseDTO {
  accessToken: string;
  user: UserDTO;
}

export interface UserDTO {
  id: UUID;
  email: string;
  profileDescription: string | null;
}
```

## 4. Przepływ danych

1. Walidacja danych wejściowych przez Zod schema
2. Przekazanie danych do AuthService
3. Wywołanie Supabase Auth API
4. Mapowanie odpowiedzi na AuthResponseDTO
5. Zwrócenie odpowiedzi do klienta

## 5. Względy bezpieczeństwa

- Wykorzystanie HTTPS (wymagane przez Supabase)
- Walidacja danych wejściowych przez Zod
- Bezpieczne przechowywanie hashy haseł (obsługiwane przez Supabase)
- Automatyczna ochrona przed atakami CSRF (Supabase)
- Automatyczna ochrona przed SQL Injection (Supabase)
- Rate limiting na poziomie API (do implementacji)

## 6. Obsługa błędów

- **400 Bad Request**:
  - Nieprawidłowy format email
  - Hasło nie spełnia wymagań
  - Brakujące wymagane pola
- **401 Unauthorized**:
  - Nieprawidłowe dane logowania
  - Konto zablokowane
- **500 Internal Server Error**:
  - Błąd serwera Supabase
  - Błąd mapowania danych

## 7. Rozważania dotyczące wydajności

- Cachowanie odpowiedzi Supabase Auth
- Implementacja rate limitingu
- Monitorowanie czasu odpowiedzi
- Logowanie błędów dla analizy wydajności

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

  async login(command: LoginCommand): Promise<AuthResponseDTO> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    });

    if (error) throw error;

    return {
      accessToken: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        profileDescription: data.user.user_metadata.profileDescription,
      },
    };
  }
}
```

### 3. Implementacja endpointu

```typescript
// src/pages/api/auth/login.ts
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const command = loginSchema.parse(body);

    const service = new AuthService(locals.supabase);
    const response = await service.login(command);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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

    if (error instanceof AuthError) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }

    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
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
