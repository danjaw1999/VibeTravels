import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '@/db/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email, password are required' }),
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
    }

    await supabase.auth.signInWithPassword({
      email,
      password,
    });
    

    return new Response(JSON.stringify({ user: authData.user }), { status: 200 });
  } catch (err) {
    console.error('Signup error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};