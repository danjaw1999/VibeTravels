import { useState } from 'react';
import type { CreateTravelNoteCommand } from '@/types';
import { TravelNoteService } from '@/lib/services/travel-note.service';
import { supabase } from '@/db/supabase.client';
import { AuthService } from '@/lib/services/auth.service';

export function useCreateTravelNote() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNote = async (data: CreateTravelNoteCommand) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Fetch directly from the Supabase client to check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session check error:", sessionError);
        throw new Error('Authentication error. Please try again.');
      }
      
      if (!session) {
        console.error("No session found");
        // Try to manually refresh session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error("Session refresh failed:", refreshError);
          throw new Error('Please log in to create a travel note');
        }
        console.log("Session refreshed successfully");
      }
      
      // Log session info for debugging
      console.log("Using session with user:", 
        session?.user?.id, 
        "expires:", new Date((session?.expires_at || 0) * 1000).toLocaleString()
      );
      
      // Create the travel note directly with the service
      const service = new TravelNoteService(supabase);
      const note = await service.createTravelNote(data);
      window.location.href = `/travel-notes/${note.id}`;
      return note;
    } catch (err) {
      console.error("Error creating note:", err);
      if (err instanceof Error) {
        if (err.message.includes('authenticated') || err.message.includes('log in')) {
          // Try a more direct approach to checking session
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              console.log("User is actually authenticated:", user.id);
              setError("Error creating note. Please try again.");
            } else {
              window.location.href = '/login';
            }
          } catch (e) {
            window.location.href = '/login';
          }
          return;
        }
        setError(err.message);
      } else {
        setError("Failed to create travel note");
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createNote,
    isSubmitting,
    error
  };
} 