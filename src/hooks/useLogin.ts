import { useState } from 'react';
import type { LoginCommand } from '@/types';
import { supabase } from '@/db/supabase.client';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (command: LoginCommand, redirectTo: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!command.email || !command.password) {
        throw new Error('Email and password are required');
      }

      console.log('Starting Supabase authentication...');
      
      // First, authenticate with Supabase directly - this sets localStorage
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: command.email,
        password: command.password,
      });

      if (signInError) {
        console.error('Supabase sign-in error:', signInError);
        throw signInError;
      }

      if (!data.session) {
        console.error('No session returned from Supabase');
        throw new Error('No session returned from Supabase');
      }

      console.log('Supabase auth successful!', {
        userId: data.user.id,
        sessionExpires: data.session.expires_at 
          ? new Date(data.session.expires_at * 1000).toLocaleString()
          : 'unknown',
        hasAccessToken: !!data.session.access_token,
      });
      
      // Check localStorage directly to confirm it was set
      setTimeout(() => {
        const storageItems = Object.keys(localStorage)
          .filter(key => key.includes('supabase'))
          .reduce((obj, key) => {
            obj[key] = '(value present)';
            return obj;
          }, {} as Record<string, string>);
        
        console.log('LocalStorage after auth:', storageItems);
      }, 500);

      // Then call our server endpoint to synchronize cookies with the SAME tokens
      // that were stored in localStorage
      try {
        console.log('Synchronizing cookies with localStorage tokens...');
        const syncResponse = await fetch('/api/auth/sync-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
        });

        if (!syncResponse.ok) {
          console.warn('Warning: Server-side cookie setup failed, but client auth succeeded.');
        } else {
          console.log('Server-side cookies synchronized with localStorage tokens');
        }
      } catch (serverError) {
        console.warn('Warning: Server-side cookie setup error:', serverError);
        // We don't throw here because the client-side auth is already successful
      }

      // Check if session is stored properly
      const { data: sessionCheck } = await supabase.auth.getSession();
      console.log('Session check after login:', {
        hasSession: !!sessionCheck.session,
        userId: sessionCheck.session?.user?.id,
      });

      // Redirect on success
      window.location.href = redirectTo;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
} 