import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService, AuthError } from '../auth.service';
import type { LoginCommand } from '../../schemas/auth.schema';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('AuthService', () => {
  const mockSignInWithPassword = vi.fn();
  const mockSetSession = vi.fn();
  
  const mockSupabase = {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      setSession: mockSetSession,
      // Add required properties with no-op implementations
      instanceID: 'test',
      admin: {},
      mfa: {},
      storageKey: 'test',
      // Add other required methods as needed
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      // ... other required methods
    }
  } as unknown as SupabaseClient;

  const service = new AuthService(mockSupabase);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully login with valid credentials', async () => {
    const mockCredentials: LoginCommand = {
      email: 'test@example.com',
      password: 'password123'
    };

    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token'
        },
        user: {
          id: 'test-id',
          email: 'test@example.com',
          user_metadata: {
            profileDescription: 'Test profile'
          }
        }
      },
      error: null
    });

    const result = await service.login(mockCredentials);

    expect(result).toEqual({
      accessToken: 'test-token',
      user: {
        id: 'test-id',
        email: 'test@example.com',
        profileDescription: 'Test profile'
      }
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith(mockCredentials);
  });

  it('should throw AuthError when credentials are invalid', async () => {
    const mockCredentials: LoginCommand = {
      email: 'test@example.com',
      password: 'wrong-password'
    };

    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: {
        message: 'Invalid credentials'
      }
    });

    await expect(service.login(mockCredentials)).rejects.toThrow(AuthError);
  });

  it('should throw AuthError when response data is missing', async () => {
    const mockCredentials: LoginCommand = {
      email: 'test@example.com',
      password: 'password123'
    };

    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: null,
        user: null
      },
      error: null
    });

    await expect(service.login(mockCredentials)).rejects.toThrow(AuthError);
  });

  it('should handle user without profile description', async () => {
    const mockCredentials: LoginCommand = {
      email: 'test@example.com',
      password: 'password123'
    };

    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token'
        },
        user: {
          id: 'test-id',
          email: 'test@example.com',
          user_metadata: {}
        }
      },
      error: null
    });

    const result = await service.login(mockCredentials);

    expect(result).toEqual({
      accessToken: 'test-token',
      user: {
        id: 'test-id',
        email: 'test@example.com',
        profileDescription: null
      }
    });
  });
}); 