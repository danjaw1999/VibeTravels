import { defineMiddleware } from 'astro:middleware';
import { supabase } from '../db/supabase.client';

// Type declaration for App.Locals
interface Locals extends App.Locals {}

export const onRequest = defineMiddleware(async ({ locals }, next) => {
  try {
    // Initialize supabase client in locals
    locals.supabase = supabase;
    
    // Get session from client and store user in locals if available
    const { data: { session } } = await supabase.auth.getSession();
    locals.user = session?.user || null;
    
    return await next();
  } catch (error) {
    console.error('Middleware error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}); 