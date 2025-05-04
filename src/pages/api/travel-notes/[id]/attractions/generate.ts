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

// Cloudflare specific headers
const RESPONSE_HEADERS = {
  "Content-Type": "application/json",
  // Prevent Cloudflare from caching the response
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Surrogate-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
  // Increase Cloudflare timeout
  "CF-Max-Timeout": "60", // 60 seconds timeout
};

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Debug environment and request info
    console.log("Request debug info:", {
      hasOpenAiKey: !!import.meta.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      hasPexelsApiKey: !!import.meta.env.PEXELS_API_KEY,
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      dev: import.meta.env.DEV,
      // Add Cloudflare-specific info if available
      cfRay: Astro.request.headers.get("cf-ray") || "N/A",
      cfWorker: Astro.request.headers.get("cf-worker") || "N/A",
      cfIpCountry: Astro.request.headers.get("cf-ipcountry") || "N/A",
    });

    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: RESPONSE_HEADERS,
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Travel note ID is required" }), {
        status: 400,
        headers: RESPONSE_HEADERS,
      });
    }

    // Check if required environment variables are present
    if (!import.meta.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({
          error: "Server configuration error: OpenAI API key is missing",
          debug: "Check environment variables configuration",
        }),
        {
          status: 500,
          headers: RESPONSE_HEADERS,
        }
      );
    }

    if (!import.meta.env.PEXELS_API_KEY) {
      console.error("Pexels API key is missing");
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Pexels API key is missing",
          debug: "Check environment variables configuration",
        }),
        {
          status: 500,
          headers: RESPONSE_HEADERS,
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
          headers: RESPONSE_HEADERS,
        }
      );
    }

    // Set a timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Operation timed out")), 55000); // 55 seconds timeout
    });

    // Wrap the main operation in a race with the timeout
    const operationPromise = async () => {
      const travelNoteService = new TravelNoteService(locals.supabase);
      const travelNote = await travelNoteService.getTravelNoteById(id);

      if (!travelNote) {
        return new Response(JSON.stringify({ error: "Travel note not found" }), {
          status: 404,
          headers: RESPONSE_HEADERS,
        });
      }

      if (travelNote.user_id !== locals.user.id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: RESPONSE_HEADERS,
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

      // Cache the results
      suggestionsCache.set(cacheKey, {
        suggestions,
        timestamp: now,
      });

      return new Response(JSON.stringify({ suggestions }), {
        status: 200,
        headers: RESPONSE_HEADERS,
      });
    };

    // Race between the operation and the timeout
    return await Promise.race([operationPromise(), timeoutPromise]);
  } catch (error) {
    console.error("Error generating suggestions:", error);

    // Check if it's a timeout error
    const isTimeout =
      error instanceof Error && (error.message === "Operation timed out" || error.message.includes("timeout"));

    const errorMessage = isTimeout
      ? "Request timed out. Please try again."
      : error instanceof Error
        ? error.message
        : "Internal server error";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        debug: {
          cfRay: Astro.request.headers.get("cf-ray"),
          isTimeout,
        },
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: RESPONSE_HEADERS,
      }
    );
  }
};
