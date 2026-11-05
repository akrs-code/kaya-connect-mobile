import { z } from 'zod';
import { objectId } from '../../common/utils/zod';
export const messagesQuery = z.object({
  before: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
export const sendSchema = z.object({
  text: z.string().trim().max(2000).optional(),
});
