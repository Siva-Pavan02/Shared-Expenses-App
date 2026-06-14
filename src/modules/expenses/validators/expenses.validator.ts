import { z } from 'zod';

export const createExpenseSchema = z.object({
  params: z.object({
    groupId: z.string().uuid()
  }),
  body: z.object({
    description: z.string().min(1),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3),
    exchangeRate: z.number().positive().optional(),
    date: z.string().datetime(),
    splitType: z.enum(['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE']),
    participants: z.array(z.object({
      userId: z.string().uuid(),
      value: z.number().nonnegative().optional()
    })).min(1, 'At least one participant is required')
  })
});

export const updateExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    exchangeRate: z.number().positive().optional(),
    date: z.string().datetime().optional(),
    splitType: z.enum(['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE']).optional(),
    participants: z.array(z.object({
      userId: z.string().uuid(),
      value: z.number().nonnegative().optional()
    })).min(1).optional()
  })
});
