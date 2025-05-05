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
        ? `\nPlease exclude these attractions that have already been suggested: ${excludeNames.join(", ")}`
        : "";

    const prompt = `Generate ${limit} unique tourist attraction suggestions based on the travel note:
    Title: ${name}
    Description: ${description}
    
    Return the response in the following JSON format:
    {
      "attractions": [
        {
          "name": "Attraction name in English",
          "description": "Detailed description in English (minimum 4-5 sentences)",
          "latitude": 52.2297,
          "longitude": 21.0122,
          "estimatedPrice": "Price range in USD"
        }
      ]
    }
    
    Requirements for each attraction:
    1. name: specific name of an EXISTING attraction in English
    2. description: detailed description in English containing:
       - What makes the place unique (2-3 sentences)
       - Practical visiting information (visiting time, best hours, if reservation needed)
       - Ticket information (regular/reduced prices, free entry e.g. for children up to certain age)
       - Additional attractions or amenities (restaurants, souvenir shops, accessibility)
    3. estimated price range: exact price range in format:
       - "Regular ticket: $X, reduced: $Y"
       - "Free entry"
       - "Free entry for children under X years"
    4. coordinates: REAL geographic coordinates of this attraction (DO NOT MAKE THEM UP)
    
    Focus on:
    - Only existing, real attractions (don't make up places)
    - Exact geographic coordinates for each attraction
    - Unique and interesting places matching the note's theme
    - Mix of popular and lesser-known attractions
    - Price diversity and types of attractions
    - Geographically diverse locations in the given area${excludeContext}
    
    IMPORTANT: 
    - Use ONLY real, existing attractions
    - Provide REAL geographic coordinates for each attraction
    - Make sure all descriptions are detailed and in English
    - All fields are required
    - Coordinates must be numbers (not strings)
    - Return exactly ${limit} attractions
    
    Example of a real attraction:
    {
      "name": "Tower of London",
      "description": "Historic castle and fortress in central London. The Tower has served as a royal palace, prison, treasury, and now houses the Crown Jewels. Visiting takes about 2-3 hours, best to arrive at opening to avoid crowds. The Tower is fully accessible with elevators and ramps. On-site facilities include a café with river views and a well-stocked gift shop with books and souvenirs. Free guided tours by Yeoman Warders are included in the ticket price.",
      "latitude": 51.5081,
      "longitude": -0.0759,
      "estimatedPrice": "Regular ticket: $30, reduced: $15, free for children under 5"
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
      const cleanContent = content.trim().replace(/\n/g, " ");

      const jsonMatch = cleanContent.match(/\{.*\}/);
      if (!jsonMatch) {
        console.error("No valid JSON found in response:", cleanContent);
        throw new Error("No valid JSON found in OpenAI response");
      }

      response = JSON.parse(jsonMatch[0]) as OpenAIAttractionResponse;

      if (!response.attractions || !Array.isArray(response.attractions)) {
        console.error("Invalid response structure:", response);
        throw new Error("Invalid response structure from OpenAI");
      }

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
