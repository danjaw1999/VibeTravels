# Plan Testów Projektu VibeTravels

## 1. Wprowadzenie i cele testowania

- Zapewnienie wysokiej jakości i stabilności aplikacji VibeTravels.
- Wykrycie oraz eliminacja błędów we wszystkich warstwach systemu.
- Potwierdzenie poprawności działania kluczowych funkcjonalności oraz integracji między front-endem, API i bazą danych (Supabase).
- Utrzymanie spójności interfejsu użytkownika opartego o Astro, React oraz biblioteki UI (Shadcn/ui i ewentualnie Antd).
- Zapewnienie dostępności aplikacji (accessibility) dla wszystkich użytkowników.

## 2. Zakres testów

- **Testy jednostkowe:**  
  Testowanie logiki biznesowej, helperów w `src/lib`, walidacji i funkcji utilitarnych; weryfikacja poprawności typów dzięki TypeScript oraz dodatkowym bibliotekom do walidacji typów w runtime (TypeSpec/Zod).
- **Testy integracyjne:**  
  Sprawdzenie komunikacji między:

  - API (katalog `src/pages/api`) a bazą danych (Supabase w `src/db`),
  - Middleware (`src/middleware/index.ts`) a systemem routingu,
  - Usług asynchronicznych (React Tanstack Query) i formularzy (React Hook Form) w komponentach React.
  - Wykorzystanie MSW (Mock Service Worker) do realistycznego mockowania API.

- **Testy end-to-end:**  
  Symulacja scenariuszy użytkownika obejmujących:

  - Nawigację po stronach (Astro layouts i strony w `src/pages`),
  - Interakcję z komponentami dynamicznymi (np. przyciski, formularze) oraz poprawne wyświetlanie interfejsu,
  - Realistyczne scenariusze przepływu użytkownika.

- **Testy UI i regresji wizualnej:**  
  Weryfikacja zgodności renderowania z założeniami projektowymi (Tailwind CSS, Shadcn/ui, Antd) oraz testy responsywności.
  Dokumentacja i testowanie komponentów w izolacji.

- **Testy dostępności:**
  Weryfikacja zgodności z wytycznymi WCAG i zapewnienie, że aplikacja jest dostępna dla wszystkich użytkowników.

- **Testy wydajnościowe (opcjonalnie):**  
  Ocena czasu ładowania stron, przepustowości API oraz skalowalności systemu w warunkach obciążeniowych.

## 3. Typy testów do przeprowadzenia

- Testy jednostkowe (z wykorzystaniem Vitest i React Testing Library)
- Testy integracyjne (z MSW do mockowania API)
- Testy end-to-end (przy użyciu Playwright)
- Testy regresji wizualnej (Storybook z Chromatic)
- Testy dostępności (axe-core)
- Testy wydajnościowe (opcjonalnie)

## 4. Scenariusze testowe dla kluczowych funkcjonalności

- **Astro Layouts i strony:**

  - Weryfikacja poprawnego renderowania layoutów i stron.
  - Testy responsywności oraz kompatybilności we wszystkich przeglądarkach (Chrome, Firefox, Safari).

- **API i middleware:**

  - Testy poprawności odpowiedzi API, obsługi błędów i integracji z bazą danych.
  - Weryfikacja zachowania middleware w sytuacjach błędnych i przy próbach nieautoryzowanego dostępu.
  - Wykorzystanie MSW do symulowania odpowiedzi API.

- **Komponenty React i interaktywność:**

  - Testy renderingowe oraz funkcjonalne komponentów dynamicznych.
  - Symulacja interakcji użytkownika (kliknięcia, wprowadzanie danych) z wykorzystaniem Testing Library/user-event.
  - Testy walidacji formularzy oraz obsługi wyjątków w React Hook Form.

- **Obsługa danych asynchronicznych:**

  - Testowanie mechanizmów ładowania, odświeżania i cachowania danych (React Tanstack Query).
  - Weryfikacja poprawności wyświetlania stanów ładowania i błędów.

- **Interfejs użytkownika:**

  - Testy spójności stylów i układu przy użyciu Tailwind CSS oraz komponentów Shadcn/ui (i ewentualnie Antd).
  - Testy interaktywności przy zmianie rozdzielczości ekranu.
  - Dokumentacja i testowanie komponentów UI w Storybook.

- **Dostępność:**
  - Testy automatyczne z użyciem axe-core.
  - Weryfikacja obsługi czytników ekranowych i nawigacji klawiaturowej.

## 5. Środowisko testowe

- **Lokalne środowisko deweloperskie:**  
  Na maszynach deweloperskich z pełną konfiguracją narzędzi testowych.

- **Środowisko staging:**  
  Oddzielne środowisko umożliwiające testowanie pełnej integracji, zbliżone do produkcji.

- **CI/CD:**  
  Automatyczne uruchamianie zestawów testów przy każdej komicie za pomocą GitHub Actions.

## 6. Narzędzia do testowania

- **Testy jednostkowe i integracyjne:**  
  Vitest, React Testing Library, Testing Library/user-event

- **Mockowanie API:**
  MSW (Mock Service Worker)

- **Walidacja typów runtime:**
  TypeSpec lub Zod

- **Testy end-to-end:**  
  Playwright

- **Testy komponentów UI i regresji wizualnej:**  
  Storybook z integracją Chromatic

- **Testy dostępności:**
  axe-core, Storybook a11y addon

- **Lintery i narzędzia do formatowania:**  
  Biome

- **Narzędzia CI/CD:**  
  GitHub Actions

## 7. Harmonogram testów

- **Przygotowanie środowiska testowego:** 1 tydzień
- **Konfiguracja Storybook i podstawowych narzędzi testowych:** 1 tydzień
- **Opracowanie i implementacja testów jednostkowych oraz integracyjnych:** 2 tygodnie
- **Implementacja testów end-to-end i UI:** 2-3 tygodnie
- **Testy dostępności i regresji wizualnej:** 1 tydzień
- **Testy wydajnościowe (opcjonalnie):** 1 tydzień
- **Integracja i automatyzacja testów w pipeline CI/CD:** Na bieżąco w trakcie cyklu rozwojowego

## 8. Kryteria akceptacji testów

- Pokrycie kodu testami na poziomie minimum 80%.
- Brak krytycznych błędów uniemożliwiających działanie aplikacji.
- Każda kluczowa funkcjonalność posiada przypisany zestaw scenariuszy testowych.
- Dokumentacja komponentów UI w Storybook.
- Zapewnienie dostępności zgodnej z WCAG 2.1 AA.
- Szybki feedback z systemu CI/CD oraz stabilność przejścia testów przed wdrożeniem na produkcję.

## 9. Role i odpowiedzialności

- **Zespół QA:**  
  Opracowanie, wdrożenie i utrzymanie testów oraz raportowanie i monitorowanie błędów.

- **Deweloperzy:**  
  Współpraca przy analizie wyników testów, szybkie reagowanie na zgłoszone błędy oraz wdrażanie poprawek.
  Tworzenie i utrzymanie testów jednostkowych oraz dokumentacji komponentów w Storybook.

- **DevOps:**  
  Konfiguracja i utrzymanie środowisk testowych oraz pipeline CI/CD.

- **Product Owner/Manager:**  
  Weryfikacja kryteriów akceptacji oraz monitorowanie postępów testowych w kontekście celów biznesowych.

## 10. Procedury raportowania błędów

- Rejestrowanie wszystkich błędów w systemie śledzenia (np. JIRA, GitHub Issues) z opisem kroku do reprodukcji, oczekiwanym zachowaniem i poziomem priorytetu.
- Przygotowywanie raportu testowego po każdej rundzie testów, zawierającego:
  - Liczbę wykrytych błędów (przy podziale na kategorie: krytyczne, wysoki, średni, niski)
  - Opis najważniejszych problemów i proponowane rozwiązania.
  - Metryki dostępności i wydajności.
- Regularne spotkania między zespołem QA a deweloperami w celu omówienia wyniku testów i ustalenia kolejnych kroków.

---

_Plan testów jest dokumentem żywym. W miarę postępów w rozwoju projektu oraz pojawiania się nowych funkcjonalności, plan należy aktualizować i rozwijać zgodnie z potrzebami zespołu i zmieniającymi się wymaganiami biznesowymi._

_Ostatnia aktualizacja: Wprowadzono nowsze, bardziej wydajne technologie testowe lepiej dopasowane do stack'u Astro 5, React 19 i TypeScript 5._
