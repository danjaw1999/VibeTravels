import type { AttractionDTO, UUID, AttractionSuggestionDTO } from "@/types";
import type { AttractionCreateInput } from "@lib/schemas/attractions.schema";
import { DatabaseError, NotFoundError, ForbiddenError } from "@lib/errors/api.error";
import { openai } from "@lib/openai.client";
import { searchAttractionImage } from "@lib/pexels.client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface OpenAIAttractionResponse {
  attractions: {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    image?: string;
    estimatedPrice: string;
  }[];
}

export class AttractionsService {
  constructor(private readonly supabase: SupabaseClient) {}

  async generateAttractionSuggestions(
    { name, description }: { name: string; description: string },
    limit = 6,
    excludeNames: string[] = []
  ): Promise<AttractionSuggestionDTO[]> {
    const excludeContext =
      excludeNames.length > 0
        ? `\nProszę pominąć te atrakcje, które już zostały zasugerowane: ${excludeNames.join(", ")}`
        : "";

    const prompt = `Wygeneruj ${limit} unikalnych sugestii atrakcji turystycznych na podstawie notatki podróżniczej:
    Tytuł: ${name}
    Opis: ${description}
    
    Zwróć odpowiedź w następującym formacie JSON:
    {
      "attractions": [
        {
          "name": "Nazwa atrakcji po polsku",
          "description": "Szczegółowy opis po polsku (minimum 4-5 zdań)",
          "latitude": 52.2297,
          "longitude": 21.0122,
          "estimatedPrice": "Zakres cenowy w PLN"
        }
      ]
    }
    
    Wymagania dla każdej atrakcji:
    1. name: konkretna nazwa ISTNIEJĄCEJ atrakcji w języku polskim (podaj też nazwę w języku angielskim w nawiasie)
    2. description: szczegółowy opis po polsku zawierający:
       - Co sprawia, że miejsce jest wyjątkowe (2-3 zdania)
       - Praktyczne informacje o zwiedzaniu (czas zwiedzania, najlepsze godziny, czy potrzebna rezerwacja)
       - Informacje o biletach (ceny normalne/ulgowe, darmowe wejścia np. dla dzieci do określonego wieku)
       - Dodatkowe atrakcje lub udogodnienia (restauracje, sklepy z pamiątkami, dostępność dla niepełnosprawnych)
    3. estimated price range: dokładny zakres cenowy w formacie:
       - "Bilet normalny: X zł, ulgowy: Y zł"
       - "Bezpłatne" (jeśli wstęp jest darmowy)
       - "Wstęp bezpłatny dla dzieci do X lat"
    4. coordinates: RZECZYWISTE koordynaty geograficzne tej atrakcji (NIE WYMYŚLAJ ICH)
    
    Skup się na:
    - Tylko istniejących, rzeczywistych atrakcjach (nie wymyślaj miejsc)
    - Dokładnych współrzędnych geograficznych dla każdej atrakcji
    - Unikalnych i interesujących miejscach pasujących do tematu notatki
    - Mieszance popularnych i mniej znanych atrakcji
    - Różnorodności cenowej i typach atrakcji
    - Geograficznie zróżnicowanych lokalizacjach w danym obszarze${excludeContext}
    
    WAŻNE: 
    - Używaj TYLKO rzeczywistych, istniejących atrakcji
    - Podawaj PRAWDZIWE współrzędne geograficzne dla każdej atrakcji
    - Upewnij się, że wszystkie opisy są szczegółowe i w języku polskim
    - Dodaj angielską nazwę w nawiasie dla lepszego wyszukiwania zdjęć
    - Wszystkie pola są wymagane
    - Koordynaty muszą być liczbami (nie stringami)
    - Zwróć dokładnie ${limit} atrakcji
    
    Przykład rzeczywistej atrakcji:
    {
      "name": "Zamek Królewski w Warszawie (Royal Castle in Warsaw)",
      "description": "Historyczna rezydencja królów Polski i siedziba Sejmu Rzeczypospolitej Obojga Narodów. Zamek został całkowicie zniszczony podczas II wojny światowej i odbudowany w latach 1971-1984. Dziś jest muzeum prezentującym wspaniałe wnętrza i kolekcje sztuki. Zwiedzanie trwa około 2-3 godziny, najlepiej przyjść zaraz po otwarciu, aby uniknąć tłumów. Zamek jest w pełni dostępny dla osób niepełnosprawnych, posiada windy i podjazdy. Na miejscu znajduje się kawiarnia z widokiem na Wisłę oraz bogato wyposażony sklep z pamiątkami i książkami. Wstęp bezpłatny dla dzieci do lat 16, a w niedziele wstęp wolny dla wszystkich.",
      "latitude": 52.2478,
      "longitude": 21.0137,
      "estimatedPrice": "Bilet normalny: 35 zł, ulgowy: 25 zł, w niedziele wstęp bezpłatny"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 4000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    let response: OpenAIAttractionResponse;
    try {
      // Upewnij się, że mamy pełną odpowiedź JSON
      if (!content.trim().endsWith("}")) {
        console.error("Incomplete JSON response:", content);
        throw new Error("Received incomplete JSON response from OpenAI");
      }

      response = JSON.parse(content) as OpenAIAttractionResponse;

      if (!response.attractions || !Array.isArray(response.attractions)) {
        console.error("Invalid response structure:", response);
        throw new Error("Invalid response structure from OpenAI");
      }

      // Sprawdź czy mamy dokładnie oczekiwaną liczbę atrakcji
      if (response.attractions.length !== limit) {
        console.error(`Expected ${limit} attractions, got ${response.attractions.length}`);
        throw new Error(`OpenAI returned incorrect number of attractions`);
      }

      for (const attraction of response.attractions) {
        if (
          !attraction.name ||
          !attraction.description ||
          typeof attraction.latitude !== "number" ||
          typeof attraction.longitude !== "number" ||
          !attraction.estimatedPrice
        ) {
          console.error("Invalid attraction data:", attraction);
          throw new Error("Invalid attraction data in OpenAI response");
        }

        // Sprawdź czy estimatedPrice nie jest ucięte
        if (
          attraction.estimatedPrice.endsWith("...") ||
          (attraction.estimatedPrice.toLowerCase().startsWith("bezpłat") &&
            !attraction.estimatedPrice.toLowerCase().includes("bezpłatne") &&
            !attraction.estimatedPrice.toLowerCase().includes("bezpłatny"))
        ) {
          console.error("Truncated estimatedPrice:", attraction.estimatedPrice);
          throw new Error("Truncated price information in OpenAI response");
        }
      }
    } catch (error) {
      console.error("Failed to parse or validate OpenAI response:", content);
      if (error instanceof Error) {
        throw new Error(`OpenAI response processing failed: ${error.message}`);
      }
      throw new Error("Failed to process OpenAI response");
    }

    // Pobierz zdjęcia dla wszystkich atrakcji równolegle
    const attractionsWithImages = await Promise.all(
      response.attractions.map(async ({ name, description, latitude, longitude, estimatedPrice }) => {
        // Najpierw sprawdź czy mamy już zapisane zdjęcie dla tej atrakcji
        const { data: existingAttraction } = await this.supabase
          .from("attractions")
          .select("image, image_photographer, image_photographer_url, image_source")
          .eq("name", name)
          .single();

        if (existingAttraction?.image) {
          return {
            name,
            description,
            latitude,
            longitude,
            image: {
              url: existingAttraction.image,
              photographer: existingAttraction.image_photographer || "",
              photographerUrl: existingAttraction.image_photographer_url || "",
              source: existingAttraction.image_source || "",
            },
            estimatedPrice: estimatedPrice || "Cena nieznana",
          };
        }

        // Jeśli nie mamy zapisanego zdjęcia, pobierz nowe z Pexels
        const englishName = name.match(/\((.*?)\)/)?.[1] || name;
        const pexelsImage = await searchAttractionImage(englishName);

        return {
          name,
          description,
          latitude,
          longitude,
          image: pexelsImage,
          estimatedPrice: estimatedPrice || "Cena nieznana",
        };
      })
    );

    return attractionsWithImages;
  }

  async addAttractions(noteId: UUID, userId: UUID, attractions: AttractionCreateInput[]): Promise<AttractionDTO[]> {
    // First verify the travel note exists and belongs to the user
    const { data: note, error: noteError } = await this.supabase
      .from("travel_notes")
      .select("id, user_id")
      .eq("id", noteId)
      .single();

    if (noteError) {
      throw new DatabaseError("Failed to fetch travel note", noteError);
    }

    if (!note) {
      throw new NotFoundError(`Travel note with id ${noteId} not found`);
    }

    const { user_id } = note;
    if (user_id !== userId) {
      throw new ForbiddenError("You do not have permission to modify this travel note");
    }

    // For each attraction that doesn't have an image, try to find one
    const attractionsWithImages = await Promise.all(
      attractions.map(async (attraction) => {
        if (!attraction.image) {
          const pexelsImage = await searchAttractionImage(attraction.name);
          if (pexelsImage) {
            return {
              ...attraction,
              image: pexelsImage.url,
              image_photographer: pexelsImage.photographer,
              image_photographer_url: pexelsImage.photographerUrl,
              image_source: pexelsImage.source,
            };
          }
        }
        return attraction;
      })
    );

    // Insert attractions in a transaction
    const { data: createdAttractions, error: insertError } = await this.supabase
      .from("attractions")
      .insert(
        attractionsWithImages.map((attraction) => ({
          ...attraction,
          travel_note_id: noteId,
        }))
      )
      .select("*");

    if (insertError) {
      throw new DatabaseError("Failed to create attractions", insertError);
    }

    return createdAttractions.map(
      ({
        id,
        name,
        description,
        image,
        image_photographer,
        image_photographer_url,
        image_source,
        latitude,
        longitude,
        created_at,
      }) => ({
        id,
        name,
        description,
        image: image
          ? {
              url: image,
              photographer: image_photographer || "",
              photographerUrl: image_photographer_url || "",
              source: image_source || "",
            }
          : null,
        latitude,
        longitude,
        createdAt: created_at,
      })
    );
  }
}
