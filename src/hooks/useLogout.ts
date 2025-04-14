import { useState } from 'react';
import { supabase } from '@/db/supabase.client';

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async (redirectTo = '/') => {
    try {
      setIsLoggingOut(true);
      setError(null);

      // First, sign out with Supabase client - this clears localStorage
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Supabase sign-out error:', signOutError);
        throw signOutError;
      }

      // Then clear server-side cookies
      try {
        console.log('Clearing server-side cookies...');
        const clearResponse = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!clearResponse.ok) {
          console.warn('Warning: Server-side cookie cleanup failed, but client logout succeeded.');
        }
      } catch (serverError) {
        console.warn('Warning: Server-side cookie cleanup error:', serverError);
        // We don't throw here because the client-side logout is already successful
      }

      // Redirect on success
      window.location.href = redirectTo;
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut, error };
} 