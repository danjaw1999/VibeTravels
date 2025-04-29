import type { APIRoute } from "astro";
import { TravelNoteService } from "@/lib/services/travel-note.service";
import { travelNoteUpdateSchema } from "@/lib/schemas/travel-note-update.schema";
import { z } from "zod";

export const prerender = false;

// GET /api/travel-notes/[noteId] - Get single travel note (public or authenticated)
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Travel note ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const service = new TravelNoteService(locals.supabase);
    const travelNote = await service.getTravelNoteById(params.id);

    if (!travelNote) {
      return new Response(JSON.stringify({ error: "Travel note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If note is private, check if user is authenticated
    if (!travelNote.is_public) {
      const {
        data: { user },
        error: authError,
      } = await locals.supabase.auth.getUser();
      if (authError || !user?.id || user.id !== travelNote.user_id) {
        return new Response(JSON.stringify({ error: "Authentication required to view this travel note" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(travelNote), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get travel note error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// PUT /api/travel-notes/[id] - Update travel note (authenticated, owner only)
export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Travel note ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authentication required for updating notes
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: "Authentication required to update travel notes" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Invalid JSON in request body:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const command = travelNoteUpdateSchema.parse(body);
    const service = new TravelNoteService(locals.supabase);

    try {
      const response = await service.updateTravelNote(params.id, user.id, command);
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle case where user tries to update someone else's note
      if (error instanceof Error && error.message.includes("Row level security")) {
        return new Response(JSON.stringify({ error: "You can only update your own travel notes" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Update travel note error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid input data",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// DELETE /api/travel-notes/[id] - Delete travel note (authenticated, owner only)
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Travel note ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authentication required for deleting notes
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: "Authentication required to delete travel notes" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const service = new TravelNoteService(locals.supabase);

    try {
      await service.deleteTravelNote(params.id, user.id);
      return new Response(null, { status: 204 });
    } catch (error) {
      // Handle case where user tries to delete someone else's note
      if (error instanceof Error && error.message.includes("Row level security")) {
        return new Response(JSON.stringify({ error: "You can only delete your own travel notes" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Delete travel note error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
