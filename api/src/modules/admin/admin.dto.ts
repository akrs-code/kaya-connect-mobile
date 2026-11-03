import { z } from 'zod';
import { pageQuery } from '../../common/utils/zod';
export const reportsQuery = pageQuery.extend({
  status: z.enum(['open', 'under_review', 'resolved', 'dismissed']).optional(),
});
export const resolveSchema = z.object({
  status: z.enum(['under_review', 'resolved', 'dismissed']),
  note: z.string().trim().min(5).max(300),
});
export const moderationReasonSchema = z.object({
  reason: z.string().trim().min(5).max(300),
});
export const adminAssignmentsQuery = pageQuery.extend({
  status: z
    .enum([
      'awaiting_agreement',
      'agreed',
      'in_progress',
      'completion_pending',
      'completed',
      'cancelled',
    ])
    .optional(),
});
export const adminOpportunitiesQuery = pageQuery.extend({
  status: z
    .enum(['draft', 'published', 'assigned', 'closed', 'cancelled', 'removed'])
    .optional(),
});
export const adminReviewsQuery = pageQuery.extend({
  moderationStatus: z.enum(['visible', 'hidden']).optional(),
});
export const appealDecisionSchema = z.object({
  decision: z.enum(['reinstate', 'uphold']),
  note: z.string().trim().min(5).max(300),
});
export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(60),
});
export const categoryUpdateSchema = z
  .object({ name: z.string().trim().min(2).max(60), isActive: z.boolean() })
  .partial();
export { pageQuery };
