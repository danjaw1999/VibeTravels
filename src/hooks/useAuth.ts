import { authService } from '@/lib/services/auth';
import type { LoginFormData, SignupFormData } from '@/lib/types/auth';
import { useState } from 'react';

interface User {
  id: string;
  email: string | null;
}

export const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async <T>(action: (data: T) => Promise<{ user: User }>, data: T) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await action(data);
      setIsLoading(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setIsLoading(false);
      throw err;
    }
  };

  const login = (data: LoginFormData) => handleAuthAction(authService.login, data);

  const signup = (data: SignupFormData) => handleAuthAction(authService.signup, data);

  return {
    login,
    signup,
    error,
    isLoading,
  };
};