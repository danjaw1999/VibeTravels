import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { supabase } from '@/db/supabase.client';

export const POST = (async ({ cookies, redirect }) => {
  try {
    // Clear cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    
    // Log out from Supabase (which clears localStorage)
    const authService = new AuthService(supabase);
    await authService.logout();
    
    // Redirect to home or login page
    return redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    return new Response('Logout failed', { status: 500 });
  }
}) satisfies APIRoute; 