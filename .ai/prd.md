# Dokument wymagań produktu (PRD) - VibeTravels (MVP)

## 1. Przegląd produktu
VibeTravels (MVP) to aplikacja umożliwiająca użytkownikom planowanie angażujących wycieczek przy wykorzystaniu AI. Aplikacja pozwala konwertować uproszczone notatki podróżnicze na szczegółowe plany, umożliwia zarządzanie notatkami, tworzenie profilu użytkownika oraz generowanie listy atrakcji na podstawie wpisanej destynacji i opisu podróży. Kluczowym aspektem MVP jest intuicyjność interfejsu, szybkość działania oraz bezpieczeństwo (RLS, rate limiter).

## 2. Problem użytkownika
Planowanie wycieczek w nowych miastach lub krajach jest skomplikowane, a użytkownicy często nie wiedzą, które miejsca warto odwiedzić. Brak im narzędzia, które w prosty sposób przekształciłoby ich notatki w konkretne, angażujące plany wycieczek, uwzględniające preferencje, czas oraz liczbę osób.

## 3. Wymagania funkcjonalne
1. Zarządzanie notatkami podróżnymi (CRUD) – tworzenie, odczyt, edycja i usuwanie notatek.
2. Listowanie wszystkich zaplanowanych tras i atrakcji wraz z możliwością wyszukiwania oraz kopiowania tras.
3. System rejestracji i logowania użytkowników, umożliwiający powiązanie notatek z kontem.
4. Strona profilu użytkownika zawierająca opis oraz podstawowe preferencje turystyczne.
5. Integracja AI – konwersja notatek (destynacja, opis) na listę atrakcji zawierającą:
   - name (string)
   - description (string) – zawierający szczegóły, takie jak opis i ewentualna cena wejścia (jeśli dostępna)
   - image (string)
   - localization (obiekt z lat i lon) – służący do generacji linków do Google Maps.
6. Osobny endpoint do dodawania wybranych atrakcji do trasy.
7. Generowanie linków do Google Maps na podstawie danych lokalizacyjnych atrakcji, upraszczając pełną integrację API.

## 4. Granice produktu
- Nie obejmuje funkcjonalności współdzielenia planów wycieczkowych między użytkownikami.
- Brak zaawansowanej obsługi multimediów (np. szczegółowej analizy zdjęć).
- Nie przewiduje zaawansowanego planowania czasu i logistyki.
- Uproszczona integracja z Google Maps poprzez generowanie linków zamiast pełnej integracji API.
- W MVP profil użytkownika zawiera wyłącznie podstawowy opis, bez dodatkowych pól (np. szczegółowych danych demograficznych), które mogą być rozszerzone w przyszłości.

## 5. Historyjki użytkowników

### US-001: Zarządzanie notatkami podróżnymi
- Tytuł: Dodawanie, edytowanie, usuwanie i przeglądanie notatek podróżnych
- Opis: Jako użytkownik chcę móc tworzyć, modyfikować i usuwać notatki dotyczące moich przyszłych wycieczek, aby łatwo zarządzać moimi planami wycieczkowych.
- Kryteria akceptacji:
  - Użytkownik potrafi utworzyć notatkę z wymaganymi polami (destynacja, opis).
  - Notatka jest zapisywana i poprawnie wyświetlana na liście.
  - Użytkownik może edytować lub usunąć istniejącą notatkę.

### US-002: Rejestracja i logowanie użytkownika
- Tytuł: System rejestracji i logowania
- Opis: Jako użytkownik chcę móc zarejestrować się i zalogować, aby uzyskać dostęp do moich notatek oraz spersonalizowanego profilu.
- Kryteria akceptacji:
  - Użytkownik może utworzyć konto przy użyciu adresu e-mail i hasła.
  - Użytkownik może zalogować się do systemu.
  - System stosuje zabezpieczenia, takie jak RLS i rate limiter, aby chronić dane użytkowników.

### US-003: Strona profilu użytkownika
- Tytuł: Zarządzanie profilem użytkownika
- Opis: Jako użytkownik chcę mieć stronę profilu, na której mogę wpisać opis o sobie oraz swoje podstawowe preferencje turystyczne.
- Kryteria akceptacji:
  - Użytkownik może edytować swój profil i dodać opis.
  - Profil wyświetla się poprawnie po zalogowaniu.

### US-004: Integracja AI do generowania planów wycieczkowych
- Tytuł: Konwersja notatek w szczegółowe plany wycieczkowe
- Opis: Jako użytkownik chcę, aby system AI konwertował moje notatki (destynacja, opis) na listę atrakcji, aby poznać propozycje miejsc do odwiedzenia w danym mieście.
- Kryteria akceptacji:
  - Po wpisaniu destynacji i opisu, system AI generuje listę atrakcji zawierającą: name, description, image, lokalizację (lat, lon) oraz ewentualną cenę wejścia.
  - Lista atrakcji jest prezentowana w intuicyjnym i czytelnym formacie.

### US-005: Dodawanie wybranych atrakcji do trasy
- Tytuł: Zapis wybranych atrakcji do trasy
- Opis: Jako użytkownik chcę zaznaczyć atrakcje z listy wygenerowanej przez AI, aby móc stworzyć trasę zawierającą linki do Google Maps.
- Kryteria akceptacji:
  - Użytkownik może wybrać atrakcje, które chce odwiedzić.
  - Osobny endpoint zapisuje listę wybranych atrakcji.
  - Dla każdej wybranej atrakcji generowany jest link do Google Maps na podstawie danych lokalizacyjnych.

## 6. Metryki sukcesu
1. Co najmniej 90% użytkowników posiada wypełnione preferencje turystyczne w swoich profilach.
2. Wysoki wskaźnik aktywności użytkowników, mierzony poprzez interakcje z notatkami i generowanie planów wycieczek.
3. Znacząca liczba nowych rejestracji oraz aktywnych użytkowników korzystających z funkcjonalności notatek.
4. Pozytywne opinie na temat intuicyjności interfejsu oraz responsywności aplikacji. 