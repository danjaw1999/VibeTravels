import { useState, useCallback } from 'react';
import type { RegisterCommand } from '@/lib/schemas/auth.schema';
import type { UserDTO } from '@/types';

interface UseRegisterReturn {
  register: (data: RegisterCommand) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  user: UserDTO | null;
}

export const useRegister = (): UseRegisterReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserDTO | null>(null);

  const register = useCallback(async (data: RegisterCommand) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Register the user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        if (registerResponse.status === 409) {
          throw new Error('Email already exists');
        }
        if (registerResponse.status === 400) {
          throw new Error(registerData.details?.[0]?.message || 'Invalid input data');
        }
        throw new Error(registerData.error || 'Registration failed');
      }

      // 2. Auto-login after successful registration
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error('Auto-login failed after registration');
      }

      setUser(loginData.user);
      
      // 3. Sync tokens to ensure both localStorage and cookies have the same tokens
      const syncResponse = await fetch('/api/auth/sync-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!syncResponse.ok) {
        console.warn('Failed to sync tokens after registration');
      }

      // 4. Redirect to welcome page
      window.location.href = '/welcome';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    register,
    isLoading,
    error,
    user,
  };
}; 