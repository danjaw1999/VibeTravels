import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttractionsService } from '../attractions.service';
import { DatabaseError, NotFoundError, ForbiddenError } from '@lib/errors/api.error';
import type { SupabaseClient } from '@supabase/supabase-js';
import { openai } from '@lib/openai.client';
import type { OpenAI } from 'openai';

interface MockChatCompletionMessage {
  role: 'assistant';
  content: string;
  function_call?: undefined;
  tool_calls?: undefined;
  name?: undefined;
}

interface MockChatCompletion {
  id: string;
  choices: Array<{
    message: MockChatCompletionMessage;
    finish_reason: 'stop';
    index: number;
    logprobs: null;
  }>;
  created: number;
  model: string;
  object: 'chat.completion';
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
  system_fingerprint: string | undefined;
}

describe('AttractionsService', () => {
  let service: AttractionsService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn()
        }))
      }))
    } as unknown as SupabaseClient;

    service = new AttractionsService(mockSupabase);
  });

  describe('generateAttractionSuggestions', () => {
    it('should generate attractions based on travel note', async () => {
      const mockCompletion: MockChatCompletion = {
        id: 'mock-completion-id',
        choices: [{
          message: {
            role: 'assistant',
            content: JSON.stringify({
              attractions: [{
                name: 'Test Attraction',
                description: 'A test description',
                latitude: 50.0,
                longitude: 20.0,
                estimatedPrice: '$10-20'
              }]
            })
          },
          finish_reason: 'stop',
          index: 0,
          logprobs: null
        }],
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        object: 'chat.completion',
        usage: { completion_tokens: 100, prompt_tokens: 100, total_tokens: 200 },
        system_fingerprint: undefined
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValueOnce(mockCompletion);

      const result = await service.generateAttractionSuggestions(
        { name: 'Test Note', description: 'Test description' }
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Test Attraction',
        description: 'A test description',
        latitude: 50.0,
        longitude: 20.0,
        estimatedPrice: '$10-20',
        image: null
      });
    });
  });

  describe('addAttractions', () => {
    const testNoteId = 'test-note-id';
    const testUserId = 'test-user-id';
    const testAttractions = [{
      name: 'Test Attraction',
      description: 'Test description',
      latitude: 50.0,
      longitude: 20.0
    }];

    it('should add attractions when user owns the note', async () => {
      const mockNote = { id: testNoteId, user_id: testUserId };
      const mockCreatedAttractions = [{
        id: 'new-id',
        name: 'Test Attraction',
        description: 'Test description',
        image: null,
        latitude: 50.0,
        longitude: 20.0,
        created_at: '2024-03-20T12:00:00Z'
      }];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockNote, error: null }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        contains: vi.fn(),
        textSearch: vi.fn(),
        match: vi.fn(),
        neq: vi.fn(),
        gt: vi.fn(),
        lt: vi.fn(),
        gte: vi.fn(),
        lte: vi.fn(),
        like: vi.fn(),
        ilike: vi.fn(),
        is: vi.fn(),
        in: vi.fn(),
        filter: vi.fn(),
        not: vi.fn(),
        or: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        range: vi.fn(),
        maybeSingle: vi.fn(),
        url: new URL('http://localhost'),
        headers: {}
      };

      vi.mocked(mockSupabase.from).mockImplementation(() => ({
        ...mockQueryBuilder,
        select: vi.fn().mockImplementation(() => ({
          ...mockQueryBuilder,
          eq: vi.fn().mockImplementation(() => ({
            ...mockQueryBuilder,
            single: vi.fn().mockResolvedValueOnce({ data: mockNote, error: null })
          }))
        })),
        insert: vi.fn().mockImplementation(() => ({
          ...mockQueryBuilder,
          select: vi.fn().mockResolvedValueOnce({ data: mockCreatedAttractions, error: null })
        }))
      }));

      const result = await service.addAttractions(testNoteId, testUserId, testAttractions);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'new-id',
        name: 'Test Attraction',
        description: 'Test description',
        image: null,
        latitude: 50.0,
        longitude: 20.0,
        createdAt: '2024-03-20T12:00:00Z'
      });
    });

    it('should throw NotFoundError when note does not exist', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
        url: new URL('http://localhost'),
        headers: {},
        insert: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      };

      vi.mocked(mockSupabase.from).mockImplementation(() => mockQueryBuilder);

      await expect(
        service.addAttractions(testNoteId, testUserId, testAttractions)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user does not own the note', async () => {
      const mockNote = { id: testNoteId, user_id: 'different-user-id' };
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockNote, error: null }),
        url: new URL('http://localhost'),
        headers: {},
        insert: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      };

      vi.mocked(mockSupabase.from).mockImplementation(() => mockQueryBuilder);

      await expect(
        service.addAttractions(testNoteId, testUserId, testAttractions)
      ).rejects.toThrow(ForbiddenError);
    });
  });
}); 