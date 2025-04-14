import type { MiddlewareHandler, APIContext } from 'astro';
import type { Locals } from '@/types';

export const authenticateUser: MiddlewareHandler = async (context: APIContext & { locals: Locals }) => {
  const { locals, redirect } = context;
  const supabase = locals.supabase;

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return redirect('/login');
    }

    // Add user to locals for use in routes
    locals.user = session.user;
    
    return undefined; // Continue to route handler
  } catch (error) {
    console.error('Auth middleware error:', error);
    return redirect('/login');
  }
}; 