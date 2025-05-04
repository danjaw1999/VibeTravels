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
    console.log("[AttractionsService] Starting generation...");
    const startTime = Date.now();

    try {
      // First, try to get existing attractions with similar names
      console.log("[AttractionsService] Checking existing attractions...");
      const { data: existingAttractions } = await this.supabase
        .from("attractions")
        .select(
          "name, description, latitude, longitude, image, image_photographer, image_photographer_url, image_source"
        )
        .ilike("name", `%${name.split(" ")[0]}%`)
        .limit(limit);

      if (existingAttractions?.length === limit) {
        console.log(`[AttractionsService] Found ${existingAttractions.length} existing attractions`);
        return existingAttractions.map((attraction) => ({
          name: attraction.name,
          description: attraction.description,
          latitude: attraction.latitude,
          longitude: attraction.longitude,
          image: attraction.image
            ? {
                url: attraction.image,
                photographer: attraction.image_photographer || "",
                photographerUrl: attraction.image_photographer_url || "",
                source: attraction.image_source || "",
              }
            : null,
          estimatedPrice: "Price information available at location",
        }));
      }

      // If not enough existing attractions, generate new ones with OpenAI
      console.log("[AttractionsService] Generating new attractions with OpenAI...");
      const openaiStart = Date.now();

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          {
            role: "user",
            content: this.generatePrompt(name, description, limit, excludeNames),
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 4000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      console.log(`[AttractionsService] OpenAI response received in ${Date.now() - openaiStart}ms`);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned empty response");
      }

      const response = await this.parseOpenAIResponse(content, limit);

      // Process images in parallel with a timeout
      console.log("[AttractionsService] Processing images...");
      const imageStart = Date.now();

      const attractionsWithImages = await Promise.all(
        response.attractions.map(async ({ name, description, latitude, longitude, estimatedPrice }) => {
          try {
            // Set a timeout for image fetching
            const imagePromise = this.getAttractionImage(name);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Image fetch timeout")), 3000)
            );

            const image = await Promise.race([imagePromise, timeoutPromise]).catch(() => null); // If timeout or error, continue without image

            return {
              name,
              description,
              latitude,
              longitude,
              image,
              estimatedPrice: estimatedPrice || "Price information available at location",
            };
          } catch (error) {
            console.error(`[AttractionsService] Error processing image for ${name}:`, error);
            // Continue without image if there's an error
            return {
              name,
              description,
              latitude,
              longitude,
              image: null,
              estimatedPrice: estimatedPrice || "Price information available at location",
            };
          }
        })
      );

      console.log(`[AttractionsService] Images processed in ${Date.now() - imageStart}ms`);
      console.log(`[AttractionsService] Total generation time: ${Date.now() - startTime}ms`);

      return attractionsWithImages;
    } catch (error) {
      console.error("[AttractionsService] Generation error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        timing: { total: Date.now() - startTime },
      });
      throw error;
    }
  }

  private async getAttractionImage(name: string): Promise<AttractionSuggestionDTO["image"]> {
    // First check if we have the image cached in the database
    const { data: existingAttraction } = await this.supabase
      .from("attractions")
      .select("image, image_photographer, image_photographer_url, image_source")
      .eq("name", name)
      .single();

    if (existingAttraction?.image) {
      return {
        url: existingAttraction.image,
        photographer: existingAttraction.image_photographer || "",
        photographerUrl: existingAttraction.image_photographer_url || "",
        source: existingAttraction.image_source || "",
      };
    }

    // If not in cache, get from Pexels
    const englishName = name.match(/\((.*?)\)/)?.[1] || name;
    return await searchAttractionImage(englishName);
  }

  private generatePrompt(name: string, description: string, limit: number, excludeNames: string[]): string {
    const excludeContext =
      excludeNames.length > 0
        ? `\nPlease exclude these attractions that have already been suggested: ${excludeNames.join(", ")}`
        : "";

    return `Generate ${limit} unique tourist attraction suggestions based on the travel note:
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
    - Return exactly ${limit} attractions`;
  }

  private async parseOpenAIResponse(content: string, limit: number): Promise<OpenAIAttractionResponse> {
    try {
      const cleanContent = content.trim().replace(/\n/g, " ");
      const jsonMatch = cleanContent.match(/\{.*\}/);

      if (!jsonMatch) {
        console.error("No valid JSON found in response:", cleanContent);
        throw new Error("No valid JSON found in OpenAI response");
      }

      const response = JSON.parse(jsonMatch[0]) as OpenAIAttractionResponse;

      if (!response.attractions || !Array.isArray(response.attractions)) {
        console.error("Invalid response structure:", response);
        throw new Error("Invalid response structure from OpenAI");
      }

      if (response.attractions.length !== limit) {
        console.error("Expected " + limit + " attractions, got " + response.attractions.length);
        throw new Error("OpenAI returned incorrect number of attractions");
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

      return response;
    } catch (error) {
      console.error("Failed to parse OpenAI response:", content);
      throw error;
    }
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
