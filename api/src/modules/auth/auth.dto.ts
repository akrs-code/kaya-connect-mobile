import { z } from 'zod';
const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Za-z]/, 'Needs a letter')
  .regex(/\d/, 'Needs a number');
// "role" is not in the schema, so it is stripped: nobody can self-register as admin
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password,
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export const refreshSchema = z.object({ refreshToken: z.string().min(20) });
export type RegisterDto = z.infer<typeof registerSchema>;
