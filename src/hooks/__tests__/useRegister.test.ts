import { renderHook, act } from '@testing-library/react';
import { useRegister } from '../useRegister';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('useRegister', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    profileDescription: 'Test description',
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Reset window.location.href
    delete window.location;
    window.location = { href: '' } as Location;
  });

  it('should handle successful registration', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.register({
        email: 'test@example.com',
        password: 'Password123',
        profileDescription: 'Test description'
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(window.location.href).toBe('/dashboard');
  });

  it('should handle email already exists error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Email already exists' })
    });

    const { result } = renderHook(() => useRegister());

    try {
      await act(async () => {
        await result.current.register({
          email: 'existing@example.com',
          password: 'Password123'
        });
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(result.current.error).toBe('Email already exists');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle validation error', async () => {
    const validationError = {
      error: 'Invalid input data',
      details: [{ message: 'Password is too weak' }]
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(validationError)
    });

    const { result } = renderHook(() => useRegister());

    try {
      await act(async () => {
        await result.current.register({
          email: 'test@example.com',
          password: 'weak'
        });
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(result.current.error).toBe('Password is too weak');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });
}); 