import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase.client';
import type { AuthResponseDTO } from '@/types';

export const useAutoLogin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authData, setAuthData] = useState<AuthResponseDTO | null>(null);

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const email = import.meta.env.VITE_AUTO_LOGIN_EMAIL;
        const password = import.meta.env.VITE_AUTO_LOGIN_PASSWORD;

        if (!email || !password) {
          throw new Error('Auto login credentials not found in environment variables');
        }

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to auto login');
        }

        const data: AuthResponseDTO = await response.json();
        setAuthData(data);

        // Set the session in Supabase client
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: '',
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error during auto login'));
      } finally {
        setIsLoading(false);
      }
    };

    autoLogin();
  }, []);

  return {
    isLoading,
    error,
    authData,
  };
}; 