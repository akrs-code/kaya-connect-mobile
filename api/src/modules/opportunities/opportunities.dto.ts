import { z } from 'zod';
import { OPP_TYPES } from '../../common/constants/statuses';
import { objectId, pageQuery } from '../../common/utils/zod';

const base = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(3000),
  category: objectId,
  opportunityType: z.enum(OPP_TYPES),
  location: z.object({
    area: z.string().trim().toLowerCase().min(2).max(100),
    address: z.string().trim().max(200).optional(),
  }),
  schedule: z.object({ start: z.coerce.date(), end: z.coerce.date() }),
  compensationType: z.enum(['paid', 'unpaid']),
  compensationAmount: z.number().min(0).max(1_000_000).optional(),
  compensationUnit: z.enum(['per_task', 'per_hour']).optional(),
  qualifications: z
    .array(z.string().trim().toLowerCase().min(1).max(60))
    .max(20),
});
export const createSchema = base.extend({ publish: z.boolean().optional() });
export const updateSchema = base.partial();
export const listSchema = pageQuery.extend({
  q: z.string().trim().max(100).optional(),
  category: objectId.optional(),
  type: z.enum(OPP_TYPES).optional(),
  area: z.string().trim().max(100).optional(),
  compensationType: z.enum(['paid', 'unpaid']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
