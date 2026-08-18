import { z } from 'zod';

/**
 * Reusable Zod primitives. These schemas are the validation + mapping seam
 * between the (mock) API and the domain model: response bodies are parsed here,
 * so the rest of the app can trust typed domain objects. If a real backend used
 * a different wire shape, this is the single place adaptation would live.
 */
export const userSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
});

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  });
}
