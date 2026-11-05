import { z } from 'zod';
import { objectId } from '../../common/utils/zod';
export const createReportSchema = z.object({
  targetType: z.enum(['opportunity', 'user']),
  targetId: objectId,
  category: z.enum(['inappropriate', 'fraud', 'harassment', 'spam', 'other']),
  description: z.string().trim().min(5).max(500),
});
export type CreateReportDto = z.infer<typeof createReportSchema>;
