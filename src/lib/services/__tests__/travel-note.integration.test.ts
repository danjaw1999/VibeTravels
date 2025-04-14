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

describe('TravelNoteService Integration Tests', () => {
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
        name: 'Test Travel Note',
        description: 'Test Description',
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

  describe('addAttractions', () => {
    it('should successfully add attractions to a note', async () => {
      const attractions: CreateAttractionCommand[] = [
        {
          name: 'Test Attraction 1',
          description: 'Description 1',
          latitude: 52.2297,
          longitude: 21.0122
        },
        {
          name: 'Test Attraction 2',
          description: 'Description 2',
          latitude: 52.2298,
          longitude: 21.0123
        }
      ];

      const result = await service.addAttractions(noteId, userId, attractions);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: attractions[0].name,
        description: attractions[0].description,
        latitude: attractions[0].latitude,
        longitude: attractions[0].longitude
      });
      expect(result[1]).toMatchObject({
        name: attractions[1].name,
        description: attractions[1].description,
        latitude: attractions[1].latitude,
        longitude: attractions[1].longitude
      });

      // Verify attractions were actually saved
      const { data: savedAttractions } = await supabase
        .from('attractions')
        .select()
        .eq('travel_note_id', noteId);

      expect(savedAttractions).toHaveLength(2);
    });

    it('should fail to add attractions to non-existent note', async () => {
      const attractions: CreateAttractionCommand[] = [
        {
          name: 'Test Attraction',
          description: 'Description',
          latitude: 52.2297,
          longitude: 21.0122
        }
      ];

      await expect(
        service.addAttractions('non-existent-id', userId, attractions)
      ).rejects.toThrow('Note not found or access denied');
    });

    it('should fail to add attractions to someone else\'s note', async () => {
      const attractions: CreateAttractionCommand[] = [
        {
          name: 'Test Attraction',
          description: 'Description',
          latitude: 52.2297,
          longitude: 21.0122
        }
      ];

      await expect(
        service.addAttractions(noteId, 'different-user-id', attractions)
      ).rejects.toThrow('Note not found or access denied');
    });
  });

  describe('removeAttraction', () => {
    let attractionId: string;

    beforeAll(async () => {
      // Create a test attraction
      const { data: attraction, error } = await supabase
        .from('attractions')
        .insert({
          travel_note_id: noteId,
          name: 'Test Attraction',
          description: 'Test Description',
          latitude: 52.2297,
          longitude: 21.0122
        })
        .select()
        .single();

      if (error) throw error;
      attractionId = attraction.id;
    });

    it('should successfully remove an attraction', async () => {
      await expect(
        service.removeAttraction(noteId, userId, attractionId)
      ).resolves.not.toThrow();

      // Verify attraction was actually deleted
      const { data: attraction } = await supabase
        .from('attractions')
        .select()
        .eq('id', attractionId)
        .single();

      expect(attraction).toBeNull();
    });

    it('should fail to remove non-existent attraction', async () => {
      await expect(
        service.removeAttraction(noteId, userId, 'non-existent-id')
      ).rejects.toThrow('Failed to delete attraction');
    });

    it('should fail to remove attraction from someone else\'s note', async () => {
      await expect(
        service.removeAttraction(noteId, 'different-user-id', attractionId)
      ).rejects.toThrow('Note not found or access denied');
    });
  });
}); 