import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TravelNoteService } from '../travel-note.service';
import type { TravelNoteCreateCommand, CreateAttractionCommand } from '../../../types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';

describe('TravelNoteService', () => {
  let service: TravelNoteService;
  const mockFrom = vi.fn();
  const mockSupabase = {
    from: mockFrom
  } as unknown as SupabaseClient<Database>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TravelNoteService(mockSupabase);
  });

  describe('addAttractions', () => {
    const mockUserId = 'user-123';
    const mockNoteId = 'note-123';
    const mockAttractions: CreateAttractionCommand[] = [
      {
        name: 'Test Attraction',
        description: 'Test Description',
        latitude: 52.2297,
        longitude: 21.0122
      }
    ];

    it('should successfully add attractions when user owns the note', async () => {
      // Mock note ownership check
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: mockNoteId },
                error: null
              })
            })
          })
        })
      });

      // Mock attraction insertion
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'attraction-123',
              ...mockAttractions[0],
              travel_note_id: mockNoteId,
              created_at: '2024-03-24T12:00:00Z'
            }],
            error: null
          })
        })
      });

      const result = await service.addAttractions(mockNoteId, mockUserId, mockAttractions);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'attraction-123',
        name: mockAttractions[0].name,
        description: mockAttractions[0].description,
        latitude: mockAttractions[0].latitude,
        longitude: mockAttractions[0].longitude
      });
    });

    it('should throw error when user does not own the note', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Note not found' }
              })
            })
          })
        })
      });

      await expect(
        service.addAttractions(mockNoteId, mockUserId, mockAttractions)
      ).rejects.toThrow('Note not found or access denied');
    });
  });

  describe('removeAttraction', () => {
    const mockUserId = 'user-123';
    const mockNoteId = 'note-123';
    const mockAttractionId = 'attraction-123';

    it('should successfully delete attraction when user owns the note', async () => {
      // Mock note ownership check
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: mockNoteId },
                error: null
              })
            })
          })
        })
      });

      // Mock attraction deletion
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null
            })
          })
        })
      });

      await expect(
        service.removeAttraction(mockNoteId, mockUserId, mockAttractionId)
      ).resolves.not.toThrow();
    });

    it('should throw error when user does not own the note', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Note not found' }
              })
            })
          })
        })
      });

      await expect(
        service.removeAttraction(mockNoteId, mockUserId, mockAttractionId)
      ).rejects.toThrow('Note not found or access denied');
    });

    it('should throw error when attraction deletion fails', async () => {
      // Mock note ownership check
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: mockNoteId },
                error: null
              })
            })
          })
        })
      });

      // Mock attraction deletion failure
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Deletion failed' }
            })
          })
        })
      });

      await expect(
        service.removeAttraction(mockNoteId, mockUserId, mockAttractionId)
      ).rejects.toThrow('Failed to delete attraction');
    });
  });

  it('should create a travel note successfully', async () => {
    const command: TravelNoteCreateCommand = {
      name: 'Trip to Paris',
      description: 'A wonderful week in Paris',
      isPublic: true
    };

    const mockDbResponse = {
      id: '123',
      user_id: 'user123',
      name: command.name,
      description: command.description,
      is_public: command.isPublic,
      created_at: '2024-03-24T12:00:00Z',
      updated_at: '2024-03-24T12:00:00Z'
    };

    mockFrom.mockResolvedValueOnce({
      data: mockDbResponse,
      error: null
    });

    const result = await service.createTravelNote('user123', command);

    expect(mockFrom).toHaveBeenCalledWith('travel_notes');
    expect(mockFrom.insert).toHaveBeenCalledWith({
      user_id: 'user123',
      name: command.name,
      description: command.description,
      is_public: command.isPublic
    });
    expect(mockFrom.select).toHaveBeenCalledWith('*');
    expect(mockFrom.single).toHaveBeenCalled();

    expect(result).toEqual({
      id: '123',
      userId: 'user123',
      name: command.name,
      description: command.description,
      isPublic: command.isPublic,
      createdAt: '2024-03-24T12:00:00Z',
      updatedAt: '2024-03-24T12:00:00Z',
      attractions: []
    });
  });

  it('should throw error when database operation fails', async () => {
    const command: TravelNoteCreateCommand = {
      name: 'Trip to Paris',
      description: 'A wonderful week in Paris'
    };

    mockFrom.mockResolvedValueOnce({
      data: null,
      error: new Error('Database error')
    });

    await expect(service.createTravelNote('user123', command))
      .rejects
      .toThrow('Failed to create travel note');
  });

  it('should throw error when no data is returned', async () => {
    const command: TravelNoteCreateCommand = {
      name: 'Trip to Paris',
      description: 'A wonderful week in Paris'
    };

    mockFrom.mockResolvedValueOnce({
      data: null,
      error: null
    });

    await expect(service.createTravelNote('user123', command))
      .rejects
      .toThrow('No data returned after creating travel note');
  });
}); 