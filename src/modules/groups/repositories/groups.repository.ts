import { prisma } from '../../../config/prisma';
import { CreateGroupDto, UpdateGroupDto } from '../dtos/groups.dto';
import { Group } from '@prisma/client';

export class GroupRepository {
  async create(data: CreateGroupDto, creatorId: string): Promise<Group> {
    return prisma.group.create({
      data: {
        name: data.name,
        baseCurrency: data.baseCurrency || 'INR',
        members: {
          create: {
            userId: creatorId,
            isAdmin: true
          }
        }
      }
    });
  }

  async findById(id: string): Promise<Group | null> {
    return prisma.group.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } }
    });
  }

  async findUserGroups(userId: string): Promise<Group[]> {
    return prisma.group.findMany({
      where: { members: { some: { userId } } }
    });
  }

  async update(id: string, data: UpdateGroupDto): Promise<Group> {
    return prisma.group.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Group> {
    return prisma.group.delete({ where: { id } });
  }
}
