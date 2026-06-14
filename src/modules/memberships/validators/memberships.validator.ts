import { z } from 'zod';

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  })
});
