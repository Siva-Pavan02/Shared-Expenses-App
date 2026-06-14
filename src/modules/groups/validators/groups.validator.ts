import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Group name must be at least 2 characters'),
    baseCurrency: z.string().length(3).optional()
  })
});

export const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    baseCurrency: z.string().length(3).optional()
  })
});
