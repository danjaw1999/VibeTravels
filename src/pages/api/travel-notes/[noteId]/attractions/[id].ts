import type { APIRoute } from 'astro';
import { TravelNoteService } from '../../../../../lib/services/travel-note.service';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { user } = locals;
    if (!user) {
      return new Response(JSON.stringify({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      }), { status: 401 });
    }

    const { noteId, id } = params;
    if (!noteId || !id) {
      return new Response(JSON.stringify({
        message: 'Travel note ID and attraction ID are required',
        code: 'INVALID_INPUT'
      }), { status: 400 });
    }

    const travelNoteService = new TravelNoteService(locals.supabase);
    await travelNoteService.removeAttraction(noteId, user.id, id);

    return new Response(null, { 
      status: 204 
    });
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message;
      
      if (message === 'Note not found or access denied') {
        return new Response(JSON.stringify({
          message: 'Note not found or access denied',
          code: 'NOT_FOUND_OR_FORBIDDEN'
        }), { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (message === 'Failed to delete attraction') {
        return new Response(JSON.stringify({
          message: 'Failed to delete attraction',
          code: 'DELETE_ERROR'
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }

    console.error('Error deleting attraction:', error);
    return new Response(JSON.stringify({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 