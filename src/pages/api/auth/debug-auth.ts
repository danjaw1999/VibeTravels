import type { APIRoute } from 'astro';
import { supabase } from '@/db/supabase.client';

export const prerender = false;

export const GET = (async ({ cookies, request }) => {
  try {
    // Check all authentication methods
    const authStatus: {
      supabaseSession: null | {
        userId: string;
        expires: number | undefined;
        hasAccessToken: boolean;
        hasRefreshToken: boolean;
      };
      cookies: {
        accessToken: boolean;
        refreshToken: boolean;
      };
    } = {
      // Check direct Supabase client
      supabaseSession: null,
      // Check cookies
      cookies: {
        accessToken: !!cookies.get('sb-access-token')?.value,
        refreshToken: !!cookies.get('sb-refresh-token')?.value
      }
    };
    
    // Check Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session) {
      authStatus.supabaseSession = {
        userId: session.user.id,
        expires: session.expires_at,
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token
      };
    }
    
    return new Response(
      JSON.stringify({
        message: 'Authentication status',
        status: authStatus
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Authentication debug error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
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
