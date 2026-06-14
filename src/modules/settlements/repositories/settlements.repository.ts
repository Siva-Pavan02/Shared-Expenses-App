import { prisma } from '../../../config/prisma';
import { Prisma } from '@prisma/client';

export class SettlementRepository {
  async create(data: Prisma.SettlementCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.settlement.create({
      data,
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } }
      }
    });
  }

  async findGroupSettlements(groupId: string) {
    return prisma.settlement.findMany({
      where: { groupId, deletedAt: null },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } }
      },
      orderBy: { date: 'asc' }
    });
  }

  async findById(id: string) {
    return prisma.settlement.findUnique({
      where: { id },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } }
      }
    });
  }

  async softDelete(id: string) {
    return prisma.settlement.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
