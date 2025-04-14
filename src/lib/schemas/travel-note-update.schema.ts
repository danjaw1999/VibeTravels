import { z } from 'zod';

// Schema walidacji UUID
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Schema walidacji aktualizacji notatki
export const travelNoteUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .trim()
    .optional(),
  isPublic: z
    .boolean()
    .optional()
});

export type TravelNoteUpdate = z.infer<typeof travelNoteUpdateSchema>; 