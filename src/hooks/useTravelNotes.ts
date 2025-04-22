import { useState } from "react";
import type { CreateTravelNoteCommand } from "@/types";

export function useTravelNotes() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTravelNote = async (noteData: CreateTravelNoteCommand) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/travel-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = "/auth/login";
          return null;
        }
        throw new Error(errorData.message || "Failed to create travel note");
      }

      const { data: note } = await response.json();
      return note;
    } catch (err) {
      console.error("API call failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create travel note"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createTravelNote,
    isLoading,
    error,
  };
} 