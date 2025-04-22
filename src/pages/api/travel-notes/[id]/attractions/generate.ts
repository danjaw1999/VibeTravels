import type { APIRoute } from 'astro';
import { AttractionsService } from '@/lib/services/attractions.service';
import { TravelNoteService } from '@/lib/services/travel-note.service';
import type { AttractionSuggestionDTO } from '@/types';

// Simple in-memory cache with TTL
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds
interface CacheEntry {
  suggestions: AttractionSuggestionDTO[];
  timestamp: number;
}
const suggestionsCache = new Map<string, CacheEntry>();

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Travel note ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check cache first
    const cacheKey = `${id}-${locals.user.id}`;
    const cachedEntry = suggestionsCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_TTL) {
      return new Response(JSON.stringify({ suggestions: cachedEntry.suggestions, fromCache: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Pobierz travel note
    const travelNoteService = new TravelNoteService(locals.supabase);
    const travelNote = await travelNoteService.getTravelNoteById(id);

    if (!travelNote) {
      return new Response(JSON.stringify({ error: 'Travel note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sprawdź czy użytkownik jest właścicielem
    if (travelNote.user_id !== locals.user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generuj sugestie
    const attractionsService = new AttractionsService(locals.supabase);
    const suggestions = await attractionsService.generateAttractionSuggestions({
      name: travelNote.name,
      description: travelNote.description
    }, 8);

    // Cache the results
    suggestionsCache.set(cacheKey, {
      suggestions,
      timestamp: now
    });

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 