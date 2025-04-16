import { createSupabaseServerInstance } from '@/db/supabase';
import { defineMiddleware } from 'astro:middleware';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/travel-notes',
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    try {
      const supabase = createSupabaseServerInstance({
        cookies,
        headers: request.headers,
      });

      // Attach supabase client to locals
      locals.supabase = supabase;

      // Get user session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Always set user in locals if available, regardless of path
      if (user) {
        locals.user = {
          email: user.email ?? null,
          id: user.id,
        };
      }
      

      // Skip auth check for public paths
      if (PUBLIC_PATHS.includes(url.pathname)) {
        return next();
      }

      return next();
    } catch (error) {
      console.error('Error in middleware:', error instanceof Error ? error.message : error);
      return next();
    }
  },
);