import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIContext } from 'astro';
import type { TravelNoteDTO } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@db/database.types';

// Import the handlers directly from the index file
import { GET } from '../travel-notes/index';

vi.mock('@lib/services/travel-note.service', () => ({
  TravelNoteService: vi.fn().mockImplementation(() => ({
    createTravelNote: vi.fn(),
    listTravelNotes: vi.fn().mockResolvedValue({
      items: mockTravelNotes,
      total: mockTravelNotes.length,
      page: 1,
      limit: 10
    })
  }))
}));

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

const mockTravelNotes: TravelNoteDTO[] = [
  {
    id: 'note-1',
    userId: mockUser.id,
    name: 'Test Note 1',
    description: 'Description 1',
    isPublic: true,
    createdAt: '2024-03-24T12:00:00Z',
    updatedAt: '2024-03-24T12:00:00Z',
    attractions: []
  },
  {
    id: 'note-2',
    userId: 'other-user',
    name: 'Test Note 2',
    description: 'Description 2',
    isPublic: true,
    createdAt: '2024-03-24T13:00:00Z',
    updatedAt: '2024-03-24T13:00:00Z',
    attractions: []
  }
];

// Create a type for our mock context
type MockContext = Partial<APIContext> & {
  locals: {
    supabase: SupabaseClient<Database>;
  };
};

describe('GET /api/travel-notes', () => {
  let context: MockContext;

  beforeEach(() => {
    vi.clearAllMocks();
    context = {
      request: new Request('http://localhost/api/travel-notes?page=1&limit=10'),
      locals: {
        supabase: {
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
          }
        } as unknown as SupabaseClient<Database>
      }
    };
  });

  it('should return travel notes for authenticated user', async () => {
    const response = await GET(context as APIContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      items: mockTravelNotes,
      total: mockTravelNotes.length,
      page: 1,
      limit: 10
    });
  });

  it('should handle invalid query parameters', async () => {
    context.request = new Request('http://localhost/api/travel-notes?page=invalid');
    const response = await GET(context as APIContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should handle database errors', async () => {
    const TravelNoteService = require('@lib/services/travel-note.service').TravelNoteService;
    const mockListTravelNotes = TravelNoteService.prototype.listTravelNotes;
    mockListTravelNotes.mockRejectedValueOnce(new Error('Database error'));

    const response = await GET(context as APIContext);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(data.message).toBe('Database error');
  });

  it('should apply search filter', async () => {
    context.request = new Request('http://localhost/api/travel-notes?page=1&limit=10&search=test');
    await GET(context as APIContext);

    const TravelNoteService = require('../../../lib/services/travel-note.service').TravelNoteService;
    const mockListTravelNotes = TravelNoteService.prototype.listTravelNotes;
    expect(mockListTravelNotes).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'test' }),
      mockUser.id
    );
  });

  it('should apply public filter', async () => {
    context.request = new Request('http://localhost/api/travel-notes?page=1&limit=10&isPublic=true');
    await GET(context as APIContext);

    const TravelNoteService = require('../../../lib/services/travel-note.service').TravelNoteService;
    const mockListTravelNotes = TravelNoteService.prototype.listTravelNotes;
    expect(mockListTravelNotes).toHaveBeenCalledWith(
      expect.objectContaining({ isPublic: true }),
      mockUser.id
    );
  });
}); 