import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { TravelNoteService } from '../travel-note.service';
import type { CreateAttractionCommand } from '../../../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables for Supabase');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

describe('TravelNoteService Performance Tests', () => {
  let service: TravelNoteService;
  let userId: string;
  let noteId: string;

  beforeAll(async () => {
    service = new TravelNoteService(supabase);

    // Create a test user
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123'
    });

    if (authError || !auth.user) {
      throw new Error('Failed to create test user');
    }
    userId = auth.user.id;

    // Create a test note
    const { data: note, error: noteError } = await supabase
      .from('travel_notes')
      .insert({
        user_id: userId,
        name: 'Performance Test Note',
        description: 'Performance Test Description',
        is_public: true
      })
      .select()
      .single();

    if (noteError || !note) {
      throw new Error('Failed to create test note');
    }
    noteId = note.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('attractions').delete().eq('travel_note_id', noteId);
    await supabase.from('travel_notes').delete().eq('id', noteId);
    await supabase.auth.admin.deleteUser(userId);
  });

  describe('Bulk Operations', () => {
    it('should handle bulk attraction creation efficiently', async () => {
      const attractions: CreateAttractionCommand[] = Array.from({ length: 50 }, (_, i) => ({
        name: `Test Attraction ${i}`,
        description: `Description for attraction ${i}`,
        latitude: 52.2297 + (i * 0.0001),
        longitude: 21.0122 + (i * 0.0001)
      }));

      const startTime = performance.now();
      const result = await service.addAttractions(noteId, userId, attractions);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result).toHaveLength(50);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all attractions were saved
      const { data: savedAttractions } = await supabase
        .from('attractions')
        .select()
        .eq('travel_note_id', noteId);

      expect(savedAttractions).toHaveLength(50);
    });

    it('should handle concurrent attraction creation', async () => {
      const createAttractionBatch = async (batchId: number) => {
        const attractions: CreateAttractionCommand[] = Array.from({ length: 10 }, (_, i) => ({
          name: `Batch ${batchId} Attraction ${i}`,
          description: `Description for batch ${batchId} attraction ${i}`,
          latitude: 52.2297 + (i * 0.0001),
          longitude: 21.0122 + (i * 0.0001)
        }));

        return service.addAttractions(noteId, userId, attractions);
      };

      const startTime = performance.now();
      const results = await Promise.all([
        createAttractionBatch(1),
        createAttractionBatch(2),
        createAttractionBatch(3),
        createAttractionBatch(4),
        createAttractionBatch(5)
      ]);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(5);
      for (const batch of results) {
        expect(batch).toHaveLength(10);
      }
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all attractions were saved
      const { data: savedAttractions } = await supabase
        .from('attractions')
        .select()
        .eq('travel_note_id', noteId);

      expect(savedAttractions).toHaveLength(50);
    });

    it('should handle ownership verification caching efficiently', async () => {
      const verifyOwnership = async () => {
        const attractions: CreateAttractionCommand[] = [{
          name: 'Cache Test Attraction',
          description: 'Testing cache performance',
          latitude: 52.2297,
          longitude: 21.0122
        }];

        return service.addAttractions(noteId, userId, attractions);
      };

      // First call - should hit database
      const startTime1 = performance.now();
      await verifyOwnership();
      const endTime1 = performance.now();
      const firstCallTime = endTime1 - startTime1;

      // Second call - should use cache
      const startTime2 = performance.now();
      await verifyOwnership();
      const endTime2 = performance.now();
      const secondCallTime = endTime2 - startTime2;

      // Second call should be significantly faster due to caching
      expect(secondCallTime).toBeLessThan(firstCallTime * 0.8);
    });
  });
}); 