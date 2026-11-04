import { z } from 'zod';
export const applySchema = z.object({
  message: z.string().trim().max(500).optional(),
});
