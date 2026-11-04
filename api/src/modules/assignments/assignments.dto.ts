import { z } from 'zod';
export const versionSchema = z.object({ version: z.number().int().min(1) });
export const proposeSchema = z.object({
  description: z.string().trim().min(10).max(3000),
  schedule: z.object({ start: z.coerce.date(), end: z.coerce.date() }),
  location: z.string().trim().min(2).max(200),
  compensationType: z.enum(['paid', 'unpaid']),
  compensationAmount: z.number().min(0).max(1_000_000).optional(),
  compensationUnit: z.enum(['per_task', 'per_hour']).optional(),
});
export const statusSchema = z.object({ status: z.literal('in_progress') });
export const cancelSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});
