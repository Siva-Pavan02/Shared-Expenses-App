import { z } from 'zod';

export const createSettlementSchema = z.object({
  params: z.object({
    groupId: z.string().uuid()
  }),
  body: z.object({
    fromUserId: z.string().uuid(),
    toUserId: z.string().uuid(),
    amount: z.number().positive('Amount must be greater than 0'),
    currency: z.string().length(3),
    exchangeRate: z.number().positive().optional(),
    date: z.string().datetime()
  }).refine((data) => data.fromUserId !== data.toUserId, {
    message: "Payer and Receiver cannot be the same person",
    path: ["toUserId"]
  })
});
