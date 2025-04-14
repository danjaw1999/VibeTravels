import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../travel-notes/[id]/attractions/index';
import { GET } from '../travel-notes/[id]/attractions/generate';
import type { APIContext } from 'astro';
import { ApiError } from '@lib/errors/api.error';
import type { User } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';

vi.mock('@lib/services/attractions.service', () => ({
  AttractionsService: vi.fn().mockImplementation(() => ({
    addAttractions: vi.fn(),
    generateAttractionSuggestions: vi.fn()
  }))
}));

describe('Attractions Endpoints', () => {
  let mockContext: APIContext;
  const testNoteId = 'test-note-id';
  const testUserId = 'test-user-id';

  beforeEach(() => {
    mockContext = {
      params: { id: testNoteId },
      locals: {
        supabase: {
          auth: {
            getUser: vi.fn()
          }
        }
      },
      request: new Request('http://localhost/test'),
      redirect: vi.fn(),
      cookies: new Map()
    } as unknown as APIContext;
  });

  describe('POST /api/travel-notes/:id/attractions', () => {
    const testAttractions = [{
      name: 'Test Attraction',
      description: 'Test description',
      latitude: 50.0,
      longitude: 20.0
    }];

    it('should create attractions when authenticated and authorized', async () => {
      // Mock authentication
      const mockUser: User = {
        id: testUserId,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString()
      };

      vi.mocked(mockContext.locals.supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      // Mock request body
      mockContext.request = new Request('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify({ attractions: testAttractions })
      });

      const response = await POST(mockContext);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('attractions');
    });

    it('should return 401 when not authenticated', async () => {
      const mockAuthError = new AuthError(
        'Unauthorized',
        401,
        'unauthorized'
      );

      vi.mocked(mockContext.locals.supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: mockAuthError
      });

      const response = await POST(mockContext);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/travel-notes/:id/attractions/generate', () => {
    it('should generate attraction suggestions', async () => {
      const mockSuggestions = [{
        name: 'Generated Attraction',
        description: 'A generated description',
        latitude: 50.0,
        longitude: 20.0,
        estimatedPrice: '$10-20'
      }];

      vi.mocked(mockContext.locals.supabase).from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { name: 'Test Note', description: 'Test description' },
          error: null
        })
      }));

      const response = await GET(mockContext);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('suggestions');
    });

    it('should return 404 when note not found', async () => {
      vi.mocked(mockContext.locals.supabase).from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: null, error: null })
      }));

      const response = await GET(mockContext);
      expect(response.status).toBe(404);
    });
  });
}); 