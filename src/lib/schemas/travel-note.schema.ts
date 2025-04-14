import { z } from 'zod';

export const createTravelNoteSchema = z.object({
  name: z
    .string()
    .min(1, 'Destination is required')
    .max(255, 'Destination must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .trim(),
  isPublic: z
    .boolean()
    .optional()
    .default(true)
}); 