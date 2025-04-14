import type { APIRoute } from 'astro';
import { TravelNoteService } from '../../../../../lib/services/travel-note.service';
import { bulkCreateAttractionsSchema } from '../../../../../lib/schemas/attraction.schema';
import { ZodError } from 'zod';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const { user } = locals;
    if (!user) {
      return new Response(JSON.stringify({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      }), { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({
        message: 'Travel note ID is required',
        code: 'INVALID_INPUT'
      }), { status: 400 });
    }

    const body = await request.json();
    const validatedBody = bulkCreateAttractionsSchema.parse(body);

    const travelNoteService = new TravelNoteService(locals.supabase);
    const attractions = await travelNoteService.addAttractions(
      id,
      user.id,
      validatedBody.attractions
    );

    return new Response(JSON.stringify({ data: { attractions } }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({
        message: 'Invalid input data',
        code: 'VALIDATION_ERROR',
        details: error.errors
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

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
    }

    console.error('Error adding attractions:', error);
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