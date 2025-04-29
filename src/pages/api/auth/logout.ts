import type { APIRoute } from "astro";
import { isFeatureEnabled } from "@/lib/featureFlags";

export const POST: APIRoute = async ({ locals }) => {
  try {
    // Check if auth feature is enabled
    if (!isFeatureEnabled("auth")) {
      return new Response(JSON.stringify({ error: "Authentication is currently disabled" }), {
        status: 403,
      });
    }

    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (err) {
    console.error("Logout error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
    });
  }
};
