import type { APIRoute } from 'astro';

export const prerender = false;

export const POST = (async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;

    if (!access_token || !refresh_token) {
      return new Response(
        JSON.stringify({
          error: 'Access token and refresh token are required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Set cookies with the exact same tokens from localStorage
    cookies.set('sb-access-token', access_token, {
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    
    cookies.set('sb-refresh-token', refresh_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Token sync error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to sync tokens'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}) satisfies APIRoute; 