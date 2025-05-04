import type { APIRoute } from "astro";
import { AttractionsService } from "@/lib/services/attractions.service";
import { TravelNoteService } from "@/lib/services/travel-note.service";
import type { AttractionSuggestionDTO } from "@/types";

// Simple in-memory cache with TTL
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds
interface CacheEntry {
  suggestions: AttractionSuggestionDTO[];
  timestamp: number;
}
const suggestionsCache = new Map<string, CacheEntry>();

export const GET: APIRoute = async ({ params, locals }) => {
  const startTime = Date.now();
  try {
    console.log("[Generate] Starting request:", {
      noteId: params.id,
      timestamp: new Date().toISOString(),
    });

    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Travel note ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if required environment variables are present
    if (!import.meta.env.PUBLIC_OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({
          error: "Server configuration error: OpenAI API key is missing",
          debug: "Check environment variables configuration",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!import.meta.env.PUBLIC_PEXELS_API_KEY) {
      console.error("Pexels API key is missing");
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Pexels API key is missing",
          debug: "Check environment variables configuration",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check cache first
    const cacheKey = `${id}-${locals.user.id}`;
    const cachedEntry = suggestionsCache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL) {
      return new Response(
        JSON.stringify({
          suggestions: cachedEntry.suggestions,
          fromCache: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Pobierz travel note
    const travelNoteService = new TravelNoteService(locals.supabase);
    console.log("[Generate] Fetching travel note...");
    const fetchStart = Date.now();
    const travelNote = await travelNoteService.getTravelNoteById(id);
    console.log(`[Generate] Travel note fetched in ${Date.now() - fetchStart}ms`);

    if (!travelNote) {
      return new Response(JSON.stringify({ error: "Travel note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sprawdź czy użytkownik jest właścicielem
    if (travelNote.user_id !== locals.user.id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generuj sugestie
    const attractionsService = new AttractionsService(locals.supabase);
    console.log("[Generate] Starting OpenAI request...");
    const openaiStart = Date.now();
    const suggestions = await attractionsService.generateAttractionSuggestions(
      {
        name: travelNote.name,
        description: travelNote.description,
      },
      8
    );
    console.log(`[Generate] OpenAI request completed in ${Date.now() - openaiStart}ms`);

    // Cache the results
    suggestionsCache.set(cacheKey, {
      suggestions,
      timestamp: now,
    });

    const totalTime = Date.now() - startTime;
    console.log(`[Generate] Total request time: ${totalTime}ms`);

    return new Response(JSON.stringify({ suggestions, timing: { total: totalTime } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[Generate] Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timing: { total: totalTime },
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        timing: { total: totalTime },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
