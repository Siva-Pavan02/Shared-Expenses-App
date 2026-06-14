import { prisma } from '../../../config/prisma';
import { GroupMember } from '@prisma/client';

export class MembershipRepository {
  async findMembership(groupId: string, userId: string): Promise<GroupMember | null> {
    return prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
  }

  async findActiveMembership(groupId: string, userId: string): Promise<GroupMember | null> {
    return prisma.groupMember.findFirst({
      where: { groupId, userId, leftAt: null }
    });
  }

  async addMember(groupId: string, userId: string, joinedAt: Date): Promise<GroupMember> {
    return prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: { leftAt: null, joinedAt }, // Rejoin logic
      create: { groupId, userId, joinedAt }
    });
  }

  async removeMember(groupId: string, userId: string, leftAt: Date): Promise<GroupMember> {
    return prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { leftAt }
    });
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
  }
}
