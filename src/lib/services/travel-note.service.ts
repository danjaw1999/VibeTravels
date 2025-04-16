import type { SupabaseClient, Tables } from '@/db/supabase';
import type { z } from 'zod';
import type { travelNoteQuerySchema } from '../schemas/travel-note-query.schema';
import type { travelNoteUpdateSchema } from '../schemas/travel-note-update.schema';
import type { TravelNoteDTO, AttractionDTO, CreateAttractionCommand, CreateTravelNoteCommand } from '../../types';
import { createAttractionSchema } from '../schemas/attraction.schema';

export type TravelNoteQuery = z.infer<typeof travelNoteQuerySchema>;
export type TravelNoteUpdate = z.infer<typeof travelNoteUpdateSchema>;

type DBTravelNote = Tables['travel_notes']['Row'];
type DBAttraction = Tables['attractions']['Row'];

type OwnershipCacheKey = `${string}:${string}`; // userId:noteId

export class TravelNoteService {
  private ownershipCache: Map<OwnershipCacheKey, boolean>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(private readonly supabase: SupabaseClient) {
    this.ownershipCache = new Map();
  }

  private getCacheKey(userId: string, noteId: string): OwnershipCacheKey {
    return `${userId}:${noteId}`;
  }

  private async verifyNoteOwnership(noteId: string, userId: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(userId, noteId);
    const cachedResult = this.ownershipCache.get(cacheKey);

    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const { data: note, error: noteError } = await this.supabase
      .from('travel_notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    const hasAccess = !noteError && !!note;
    
    // Cache the result
    this.ownershipCache.set(cacheKey, hasAccess);
    
    // Set cache expiration
    setTimeout(() => {
      this.ownershipCache.delete(cacheKey);
    }, this.CACHE_TTL);

    return hasAccess;
  }

  async createTravelNote(command: CreateTravelNoteCommand): Promise<TravelNoteDTO> {
    try {
      // Check for session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();

      if (sessionError) {
        console.error('[TravelNoteService] Session error:', sessionError);
        throw new Error('Authentication error. Please try again.');
      }

      if (!session || !session.user) {
        console.error('[TravelNoteService] No session or user found in session.');
        throw new Error('User must be authenticated to create a travel note');
      }
        
      // Directly create the travel note with the current session
      const { data, error } = await this.supabase
        .from('travel_notes')
        .insert({
          name: command.name,
          description: command.description,
          is_public: command.is_public ?? true,
          user_id: session.user.id
        })
        .select('*, attractions(*)')
        .single();

      if (error) {
        console.error('[TravelNoteService] Database error creating travel note:', error);
        if (error.message.includes('foreign key constraint') || error.code === '23503') {
          throw new Error('User profile not found. Please log out and log in again.');
        }
        throw new Error(`Failed to create travel note: ${error.message}`);
      }

      if (!data) {
        console.error('[TravelNoteService] No data returned from insert');
        throw new Error('Failed to create travel note: No data returned');
      }

      return this.mapToDTO(data);
    } catch (error) {
      console.error('[TravelNoteService] Error in createTravelNote:', error);
      throw error;
    }
  }

  async listTravelNotes(query: TravelNoteQuery): Promise<{ data: TravelNoteDTO[]; total: number }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    const userId = session?.user?.id;

    let queryBuilder = this.supabase
      .from('travel_notes')
      .select('*, attractions(*)', { count: 'exact' });

    if (query.location) {
      queryBuilder = queryBuilder.ilike('name', `%${query.location}%`);
    }

    if (userId) {
      queryBuilder = queryBuilder.or(`is_public.eq.true,and(user_id.eq.${userId})`);
    } else {
      queryBuilder = queryBuilder.eq('is_public', true);
    }

    if (query.sortBy) {
      queryBuilder = queryBuilder.order(query.sortBy, {
        ascending: query.sortOrder === 'asc',
      });
    } else {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    const { from, to } = this.getPagination(query.page, query.limit);
    queryBuilder = queryBuilder.range(from, to);


    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    return { 
      data: (data || []).map(note => this.mapToDTO(note)), 
      total: count || 0 
    };
  }

  async getTravelNoteById(id: string): Promise<TravelNoteDTO | null> {
    const { data: note, error } = await this.supabase
      .from('travel_notes')
      .select('*, attractions(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching travel note:', error);
      return null;
    }

    return note ? this.mapToDTO(note as DBTravelNote & { attractions: DBAttraction[] }) : null;
  }

  async updateTravelNote(id: string, userId: string, data: TravelNoteUpdate): Promise<TravelNoteDTO> {
    const { data: note, error } = await this.supabase
      .from('travel_notes')
      .update({
        name: data.name,
        description: data.description,
        is_public: data.isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, attractions(*)')
      .single();

    if (error) throw error;
    return this.mapToDTO(note);
  }

  async deleteTravelNote(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('travel_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async addAttractions(
    noteId: string,
    userId: string,
    attractions: CreateAttractionCommand[]
  ): Promise<AttractionDTO[]> {
    // Verify note ownership using cached check
    const hasAccess = await this.verifyNoteOwnership(noteId, userId);
    if (!hasAccess) {
      throw new Error('Note not found or access denied');
    }

    // Validate each attraction
    const validatedAttractions = attractions.map(attraction => 
      createAttractionSchema.parse(attraction)
    );

    // Insert attractions
    const { data, error } = await this.supabase
      .from('attractions')
      .insert(
        validatedAttractions.map(attraction => ({
          ...attraction,
          travel_note_id: noteId
        }))
      )
      .select(`
        id,
        name,
        description,
        image,
        image_photographer,
        image_photographer_url,
        image_source,
        latitude,
        longitude,
        created_at
      `);

    if (error) {
      throw new Error('Failed to create attractions');
    }

    // Transform to DTO
    return data.map(attraction => ({
      id: attraction.id,
      name: attraction.name,
      description: attraction.description,
      image: attraction.image && attraction.image_photographer && 
             attraction.image_photographer_url && attraction.image_source
        ? {
            url: attraction.image,
            photographer: attraction.image_photographer,
            photographerUrl: attraction.image_photographer_url,
            source: attraction.image_source
          }
        : null,
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      created_at: attraction.created_at
    }));
  }

  async removeAttraction(
    noteId: string,
    userId: string,
    attractionId: string
  ): Promise<void> {
    // Verify note ownership using cached check
    const hasAccess = await this.verifyNoteOwnership(noteId, userId);
    if (!hasAccess) {
      throw new Error('Note not found or access denied');
    }

    // Delete attraction
    const { error } = await this.supabase
      .from('attractions')
      .delete()
      .eq('id', attractionId)
      .eq('travel_note_id', noteId);

    if (error) {
      throw new Error('Failed to delete attraction');
    }

    // Invalidate cache after successful deletion
    const cacheKey = this.getCacheKey(userId, noteId);
    this.ownershipCache.delete(cacheKey);
  }

  private getPagination(page: number, limit: number) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
  }

  private mapToDTO({id, user_id, name, description, is_public, created_at, updated_at, attractions}: DBTravelNote & { attractions: DBAttraction[] }): TravelNoteDTO {
    return {
      id,
      user_id,
      name,
      description,
      is_public,
      created_at,
      updated_at,
      attractions: (attractions || []).map(({id, name, description, image, image_photographer, image_photographer_url, image_source, latitude, longitude, created_at}: DBAttraction) => ({
        id,
        name,
        description,
        image: image && image_photographer && 
               image_photographer_url && image_source
          ? {
              url: image,
              photographer: image_photographer,
              photographerUrl: image_photographer_url,
              source: image_source
            }
          : null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        created_at
      }))
    };
  }
} 