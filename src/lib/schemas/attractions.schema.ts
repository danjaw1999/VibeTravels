import { z } from "zod";

export const attractionCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
  image_photographer: z.string().nullable().optional(),
  image_photographer_url: z.string().url().nullable().optional(),
  image_source: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const addAttractionsSchema = z.object({
  attractions: z
    .array(attractionCreateSchema)
    .min(1, "At least one attraction is required")
    .max(50, "Maximum 50 attractions can be added at once"),
});

export type AddAttractionsInput = z.infer<typeof addAttractionsSchema>;
export type AttractionCreateInput = z.infer<typeof attractionCreateSchema>;
