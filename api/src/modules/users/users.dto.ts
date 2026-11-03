import { z } from 'zod';
import { DAYS } from '../../common/constants/statuses';
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const updateMeSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
});
export const profileSchema = z
  .object({
    biography: z.string().trim().max(500),
    skills: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(30),
    experience: z
      .array(
        z.object({
          title: z.string().trim().max(100),
          description: z.string().trim().max(500).optional(),
          years: z.number().min(0).max(60).optional(),
        }),
      )
      .max(20),
    availability: z
      .array(z.object({ day: z.enum(DAYS), from: time, to: time }))
      .max(14),
    serviceArea: z
      .array(z.string().trim().toLowerCase().min(2).max(100))
      .max(10),
    visibility: z
      .object({
        experience: z.boolean(),
        availability: z.boolean(),
        portfolio: z.boolean(),
      })
      .partial(),
  })
  .partial();
export const portfolioSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(300).optional(),
});
export const accountAppealSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});
