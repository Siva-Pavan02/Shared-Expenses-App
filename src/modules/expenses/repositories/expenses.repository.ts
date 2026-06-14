import { prisma } from '../../../config/prisma';
import { Prisma } from '@prisma/client';

export class ExpenseRepository {
  async createWithParticipants(expenseData: Prisma.ExpenseCreateInput, participantsData: Prisma.ExpenseParticipantCreateManyExpenseInput[], tx?: Prisma.TransactionClient) {
    console.log('5. Repository - expenseData:', JSON.stringify(expenseData));
    console.log('5. Repository - participantsData:', JSON.stringify(participantsData));

    const operation = async (client: Prisma.TransactionClient) => {
      const expense = await client.expense.create({ data: expenseData });
      
      const mappedParticipants = participantsData.map(p => ({ ...p, expenseId: expense.id }));
      await client.expenseParticipant.createMany({ data: mappedParticipants });

      return client.expense.findUnique({
        where: { id: expense.id },
        include: { participants: true }
      });
    };

    if (tx) {
      return operation(tx);
    }
    return prisma.$transaction(operation);
  }

  async findById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: { participants: true }
    });
  }

  async findGroupExpenses(groupId: string) {
    return prisma.expense.findMany({
      where: { groupId },
      include: { participants: true },
      orderBy: { date: 'asc' }
    });
  }

  async delete(id: string) {
    return prisma.expense.delete({ where: { id } });
  }

  async updateWithParticipants(id: string, expenseData: Prisma.ExpenseUpdateInput, participantsData?: Prisma.ExpenseParticipantCreateManyExpenseInput[]) {
    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({ where: { id }, data: expenseData });
      
      if (participantsData) {
        await tx.expenseParticipant.deleteMany({ where: { expenseId: id } });
        const mappedParticipants = participantsData.map(p => ({ ...p, expenseId: id }));
        await tx.expenseParticipant.createMany({ data: mappedParticipants });
      }

      return tx.expense.findUnique({
        where: { id },
        include: { participants: true }
      });
    });
  }
}
