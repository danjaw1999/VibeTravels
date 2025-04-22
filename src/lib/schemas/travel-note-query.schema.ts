import { z } from "zod";

export const travelNoteQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  location: z.string().optional(),
  tag: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  sortBy: z.enum(["created_at", "rating", "visit_date"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
