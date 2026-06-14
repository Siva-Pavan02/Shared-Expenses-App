import { prisma } from '../../../config/prisma';

export class BalanceRepository {
  async getGroupExpenses(groupId: string) {
    return prisma.expense.findMany({
      where: { groupId },
      include: {
        paidBy: { select: { id: true, name: true } },
        participants: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });
  }

  async getGroupSettlements(groupId: string) {
    return prisma.settlement.findMany({
      where: { groupId, deletedAt: null },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } }
      }
    });
  }

  async getGroupMembers(groupId: string) {
    return prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true } } }
    });
  }
}
