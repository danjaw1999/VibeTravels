import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIContext } from 'astro';
import { TravelNoteService } from '@/lib/services/travel-note.service';
import { GET, PATCH, DELETE } from './[id]';
import type { Locals } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

// Mock data
const mockTravelNote = {
  id: '3c72c272-a7fc-49bc-8a78-2ffba099dde8',
  userId: 'cd1bf26f-915a-4848-8583-05469e2859f3',
  name: 'Wycieczka do Warszawy',
  description: 'Plan na tydzień w Warszawie',
  isPublic: true,
  createdAt: '2025-04-11T19:38:00.031396+00:00',
  updatedAt: '2025-04-11T19:38:00.031396+00:00',
  attractions: []
};

// Mock Supabase client
const mockSupabaseClient = {
  from: () => ({
    select: () => ({
      single: () => Promise.resolve({ data: mockTravelNote, error: null })
    })
  })
} as unknown as SupabaseClient<Database>;

// Helper function to create test context
const createTestContext = (params: Record<string, string>, request: Request): APIContext => {
  const url = new URL(request.url);
  const ctx = {
    params,
    props: {},
    request,
    cookies: new Map(),
    url,
    site: url,
    generator: 'test',
    preferredLocale: 'pl',
    currentLocale: 'pl',
    preferredLocaleList: ['pl', 'en'],
    routePattern: '/api/travel-notes/[id]',
    originPathname: '/api/travel-notes/3c72c272-a7fc-49bc-8a78-2ffba099dde8',
    locals: {
      supabase: mockSupabaseClient
    },
    redirect: () => Promise.resolve(new Response()),
    rewrite: () => Promise.resolve(new Response()),
    clientAddress: '127.0.0.1',
    server: {
      host: 'localhost',
      port: 3000,
      protocol: 'http'
    }
  };

  return ctx as unknown as APIContext;
};

// Mock service
vi.mock('@/lib/services/travel-note.service', () => ({
  TravelNoteService: vi.fn().mockImplementation(() => ({
    getTravelNoteById: vi.fn().mockResolvedValue(mockTravelNote),
    updateTravelNote: vi.fn().mockResolvedValue({ ...mockTravelNote, name: 'Wycieczka do Gdańska' }),
    deleteTravelNote: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('Travel Notes API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/travel-notes/[id]', () => {
    it('should return a travel note when it exists', async () => {
      const response = await GET(createTestContext(
        { id: mockTravelNote.id },
        new Request('http://localhost')
      ));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockTravelNote);
    });

    it('should return 400 when id is invalid', async () => {
      const response = await GET(createTestContext(
        { id: 'invalid-uuid' },
        new Request('http://localhost')
      ));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid request data');
    });
  });

  describe('PATCH /api/travel-notes/[id]', () => {
    it('should update a travel note', async () => {
      const updateData = { name: 'Wycieczka do Gdańska' };
      const request = new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const response = await PATCH(createTestContext(
        { id: mockTravelNote.id },
        request
      ));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('Wycieczka do Gdańska');
    });

    it('should return 400 when update data is invalid', async () => {
      const request = new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' })
      });

      const response = await PATCH(createTestContext(
        { id: mockTravelNote.id },
        request
      ));

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/travel-notes/[id]', () => {
    it('should delete a travel note', async () => {
      const response = await DELETE(createTestContext(
        { id: mockTravelNote.id },
        new Request('http://localhost')
      ));

      expect(response.status).toBe(204);
    });

    it('should return 400 when id is invalid', async () => {
      const response = await DELETE(createTestContext(
        { id: 'invalid-uuid' },
        new Request('http://localhost')
      ));

      expect(response.status).toBe(400);
    });
  });
}); 