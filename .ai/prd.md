# Dokument wymagań produktu (PRD) - VibeTravels

## 1. Przegląd produktu
Aplikacja VibeTravels to MVP umożliwiające przekształcenie podstawowych notatek podróżniczych w szczegółowe plany wycieczek z wykorzystaniem AI. Produkt ma na celu ułatwić planowanie angażujących tras i atrakcji, bazując na prostych notatkach, preferencjach użytkownika i rekomendacjach generowanych przez moduł AI.

## 2. Problem użytkownika
Planowanie wycieczek jest złożonym zadaniem, szczególnie gdy użytkownik dysponuje jedynie uproszczonymi notatkami. Użytkownicy mają problem z generowaniem atrakcyjnych i kompleksowych planów podróży, które uwzględniają ich preferencje, czas, liczbę osób i specyfikę miejsc. Brakuje również intuicyjnych narzędzi do szybkiego przetwarzania tych danych i prezentacji szczegółowych rekomendacji.

## 3. Wymagania funkcjonalne
- Możliwość zapisywania, odczytywania, edycji i usuwania notatek o wycieczkach.
- Zarządzanie kontami użytkowników z profilami zawierającymi preferencje podróżnicze.
- Integracja z modułem AI, który na podstawie notatek i profilu generuje szczegółowe plany podróży.
- Automatyczne wywoływanie rekomendacji AI po finalnym zatwierdzeniu notatki oraz możliwość ręcznego odświeżenia wyników.
- Integracja z Google Maps poprzez udostępnienie prostego linku do wyświetlania trasy.
- Wdrożenie systemu ocen w oparciu o 5-gwiazdkową skalę, który wpływa na przyszłe rekomendacje.

## 4. Granice produktu
- MVP nie obejmuje funkcjonalności współdzielenia planów podróży między kontami.
- Zaawansowana obsługa multimediów, tak jak przechowywanie i analiza zdjęć, nie jest częścią MVP (zdjęcia będą pobierane z zewnętrznych polecajek).
- Nie przewiduje się zaawansowanego planowania czasu, logistyki ani rozbudowanej optymalizacji tras.
- MVP uwzględnia ograniczenia budżetowe oraz niskie obciążenie ruchem.

## 5. Historyjki użytkowników

US-001
Tytuł: Rejestracja i uwierzytelnianie
Opis: Jako nowy użytkownik, chcę móc zarejestrować konto oraz się zalogować, aby uzyskać dostęp do swoich notatek i personalizowanych rekomendacji.
Kryteria akceptacji:
- Użytkownik może utworzyć nowe konto przy użyciu adresu e-mail i hasła.
- System umożliwia logowanie i wylogowywanie.
- Dane użytkownika są zabezpieczone zgodnie z najlepszymi praktykami (np. hasło przechowywane w formie zaszyfrowanej).

US-002
Tytuł: Uzupełnienie profilu podróżniczego
Opis: Jako użytkownik, chcę uzupełnić mój profil o preferencje podróżnicze, aby system mógł dostarczać spersonalizowane rekomendacje.
Kryteria akceptacji:
- Użytkownik może dodać i edytować informacje dotyczące preferencji podróżniczych.
- System weryfikuje poprawność wprowadzonych danych przy pomocy zewnętrznych źródeł.

US-003
Tytuł: Tworzenie notatki podróżniczej
Opis: Jako użytkownik, chcę móc tworzyć notatki dotyczące miejsc i tras, zawierające opis miejsca, długość trasy, maksymalną liczbę osób, poziom trudności oraz środek transportu.
Kryteria akceptacji:
- Formularz umożliwia wprowadzenie wszystkich wymaganych pól.
- Użytkownik może zapisać notatkę, która następnie jest dostępna do edycji lub usunięcia.

US-004
Tytuł: Generowanie szczegółowego planu podróży przy użyciu AI
Opis: Jako użytkownik, po zatwierdzeniu notatki, chcę aby system przy użyciu modułu AI wygenerował szczegółowy plan podróży na podstawie moich notatek i preferencji.
Kryteria akceptacji:
- Po zatwierdzeniu notatki, system automatycznie wywołuje moduł AI, który generuje rekomendacje.
- Wygenerowany plan zawiera dodatkowe miejsca i atrakcje, dostosowane do profilu użytkownika.

US-005
Tytuł: Edycja notatki i aktualizacja rekomendacji
Opis: Jako użytkownik, chcę móc edytować istniejącą notatkę i mieć pewność, że zmiany spowodują ponowne generowanie rekomendacji przez system AI.
Kryteria akceptacji:
- Użytkownik może modyfikować zapisane notatki.
- Po edycji notatki, system umożliwia ponowne wywołanie modułu AI do aktualizacji planu podróży.

US-006
Tytuł: Przegląd trasy przy użyciu Google Maps
Opis: Jako użytkownik, chcę móc wyświetlić trasę wycieczki poprzez link, który otwiera się w Google Maps.
Kryteria akceptacji:
- System generuje link do Google Maps na podstawie danych notatki.
- Link jest poprawny i kieruje użytkownika do odpowiedniej trasy.

US-007
Tytuł: Ocena rekomendacji
Opis: Jako użytkownik, chcę ocenić wygenerowane rekomendacje przy użyciu 5-gwiazdkowego systemu, aby wpływać na przyszłe sugestie.
Kryteria akceptacji:
- Użytkownik może przypisać ocenę w formie gwiazdek do wygenerowanego planu podróży.
- System zapisuje ocenę i wykorzystuje ją przy kolejnych generacjach rekomendacji.

## 6. Metryki sukcesu
- 90 procent użytkowników posiada pełny profil z uzupełnionymi preferencjami.
- 75 procent użytkowników generuje co najmniej 1 plan podróży rocznie.
- Wydajność modułu AI: czas reakcji oraz skuteczność rekomendacji mierzona przez oceny użytkowników.
- Efektywność integracji z Google Maps (poprawność linków oraz szybkość ładowania).
- Satysfakcja użytkowników na podstawie systemu ocen oraz feedbacku. 