import type { APIRoute } from "astro";
import { travelNoteQuerySchema } from "@/lib/schemas/travel-note-query.schema";
import { TravelNoteService } from "@/lib/services/travel-note.service";
import { createTravelNoteSchema } from "@/lib/schemas/travel-note.schema";
import { z } from "zod";
import { isFeatureEnabled } from "@/lib/featureFlags";

export const prerender = false;

// GET /api/travel-notes - List travel notes (public or authenticated)
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);

    // If isPublic is not explicitly set to false, we'll show public notes
    const showPublicOnly = params.isPublic !== "false";

    // Only check auth if we want to see private notes
    if (!showPublicOnly) {
      const {
        data: { user },
        error: authError,
      } = await locals.supabase.auth.getUser();
      if (authError || !user?.id) {
        return new Response(
          JSON.stringify({
            error: "Authentication required to view private notes",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    const query = travelNoteQuerySchema.parse({
      ...params,
      isPublic: showPublicOnly,
    });

    const service = new TravelNoteService(locals.supabase);
    const response = await service.listTravelNotes(query);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("List travel notes error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: error.errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
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
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// POST /api/travel-notes - Create new travel note (authenticated only)
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  try {
    // Check if create-travel-note feature is enabled
    if (!isFeatureEnabled("create-travel-note")) {
      return new Response(
        JSON.stringify({
          error: "Creating travel notes is currently disabled",
        }),
        { status: 403 }
      );
    }

    if (!locals.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await request.json();
    console.log(body);

    const validatedData = createTravelNoteSchema.parse(body);

    const service = new TravelNoteService(locals.supabase);
    const note = await service.createTravelNote(validatedData);

    // Check if client wants redirect or JSON response
    const wantsRedirect = request.headers.get("X-Handle-Redirect") === "true";

    if (wantsRedirect) {
      return redirect(`/travel-notes/${note.id}`);
    }

    return new Response(JSON.stringify({ data: note }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating travel note:", error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to create travel note",
      }),
      { status: 500 }
    );
  }
};
