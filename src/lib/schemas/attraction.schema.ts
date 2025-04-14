import { z } from 'zod';

export const imageSchema = z.object({
  url: z.string().url(),
  photographer: z.string(),
  photographerUrl: z.string().url(),
  source: z.string().url()
}).nullable();

export const createAttractionSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  image: z.string().url().optional().nullable(),
  image_photographer: z.string().optional().nullable(),
  image_photographer_url: z.string().url().optional().nullable(),
  image_source: z.string().url().optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const bulkCreateAttractionsSchema = z.object({
  attractions: z.array(createAttractionSchema).min(1).max(50)
});

export type CreateAttractionInput = z.infer<typeof createAttractionSchema>;
export type BulkCreateAttractionsInput = z.infer<typeof bulkCreateAttractionsSchema>; 