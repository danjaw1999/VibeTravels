import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { supabase } from '@/db/supabase.client';

export const POST = (async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: 'Email and password are required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Use the auth service with supabase client
    const authService = new AuthService(supabase);
    const result = await authService.serverLogin({ email, password });

    if (!result.user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid credentials'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Set cookies for server-side authentication
    if (result.accessToken) {
      cookies.set('sb-access-token', result.accessToken, {
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
    }
    
    if (result.refreshToken) {
      cookies.set('sb-refresh-token', result.refreshToken, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
    }

    return new Response(
      JSON.stringify(result.user),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to login'
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