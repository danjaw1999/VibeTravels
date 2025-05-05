import type { APIRoute } from "astro";
import { TravelNoteService } from "@/lib/services/travel-note.service";
import type { AttractionSuggestionDTO } from "@/types";
import { OPENAI_API_KEY, PEXELS_API_KEY } from "astro:env/server";
import { AttractionsService } from "@/lib/services/attractions.service";

// Simple in-memory cache with TTL
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds
const suggestionsCache = new Map<string, { suggestions: AttractionSuggestionDTO[]; timestamp: number }>();

export const GET: APIRoute = async ({ params, locals }) => {
  try {
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
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({
          error: "Server configuration error (OpenAI API key missing)",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!PEXELS_API_KEY) {
      console.error("Pexels API key is missing");
      return new Response(
        JSON.stringify({
          error: "Server configuration error (Pexels API key missing)",
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
      return new Response(JSON.stringify({ suggestions: cachedEntry.suggestions }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const travelNoteService = new TravelNoteService(locals.supabase);
    const travelNote = await travelNoteService.getTravelNoteById(id);

    if (!travelNote) {
      return new Response(JSON.stringify({ error: "Travel note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (travelNote.user_id !== locals.user.id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const attractionsService = new AttractionsService(locals.supabase);
    const suggestions = await attractionsService.generateAttractionSuggestions(
      {
        name: travelNote.name,
        description: travelNote.description,
      },
      8
    );

    suggestionsCache.set(cacheKey, {
      suggestions,
      timestamp: now,
    });

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
