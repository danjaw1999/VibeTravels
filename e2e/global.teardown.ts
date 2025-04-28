import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";
teardown("clean up Supabase database", async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in environment variables.");
    return;
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  try {
    const e2eUserId = process.env.E2E_USERNAME_ID;

    if (!e2eUserId) {
      console.error("Missing E2E user ID in environment variables.");
      return;
    }

    const { data: travelNotesData, error: travelNotesQueryError } = await supabase
      .from("travel_notes")
      .select("id, name")
      .eq("user_id", e2eUserId);

    if (travelNotesQueryError) {
      console.error("Error querying travel notes:", travelNotesQueryError.message);
      return;
    }

    const travelNoteIds = travelNotesData?.map((note) => note.id) || [];

    if (travelNoteIds.length > 0) {
      const { error: attractionsError } = await supabase
        .from("attractions")
        .delete()
        .in("travel_note_id", travelNoteIds);

      if (attractionsError) {
        console.error("Error deleting attractions:", attractionsError.message);
      } else {
        console.error("Failed to delete all travel notes.");
      }

      const { error: notesError } = await supabase.from("travel_notes").delete().in("id", travelNoteIds);

      if (notesError) {
        console.error("Error deleting travel notes:", notesError.message);

        for (const noteId of travelNoteIds) {
          const { error } = await supabase.from("travel_notes").delete().eq("id", noteId);

          if (error) {
            console.error(`Error deleting note ${noteId}:`, error.message);
          } else {
            console.error("Failed to delete all travel notes.");
          }
        }
      } else {
        console.error("Failed to delete all travel notes.");
      }
    }

    const { data: remainingNotes, error: verifyError } = await supabase
      .from("travel_notes")
      .select("id, name")
      .eq("user_id", e2eUserId);

    if (verifyError) {
      console.error("Error verifying deletion:", verifyError.message);
    } else {
      if (remainingNotes && remainingNotes.length > 0) {
        console.error("Failed to delete all travel notes.");
      }
    }
  } catch (error) {
    console.error("Error during database cleanup:", error);
  }
});
