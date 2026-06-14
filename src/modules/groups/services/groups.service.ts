import { GroupRepository } from '../repositories/groups.repository';
import { MembershipRepository } from '../../memberships/repositories/memberships.repository';
import { CreateGroupDto, UpdateGroupDto } from '../dtos/groups.dto';

export class GroupService {
  private groupRepo = new GroupRepository();
  private membershipRepo = new MembershipRepository();

  async createGroup(data: CreateGroupDto, creatorId: string) {
    return this.groupRepo.create(data, creatorId);
  }

  async getGroupDetails(id: string, userId: string) {
    const membership = await this.membershipRepo.findMembership(id, userId);
    if (!membership) throw new Error('Forbidden: Not a member of this group');
    
    const group = await this.groupRepo.findById(id);
    if (!group) throw new Error('Group not found');
    return group;
  }

  async updateGroup(id: string, data: UpdateGroupDto, userId: string) {
    const membership = await this.membershipRepo.findMembership(id, userId);
    if (!membership || !membership.isAdmin) throw new Error('Forbidden: Only admins can update the group');
    
    return this.groupRepo.update(id, data);
  }

  async deleteGroup(id: string, userId: string) {
    const membership = await this.membershipRepo.findMembership(id, userId);
    if (!membership || !membership.isAdmin) throw new Error('Forbidden: Only admins can delete the group');
    
    return this.groupRepo.delete(id);
  }

  async listUserGroups(userId: string) {
    return this.groupRepo.findUserGroups(userId);
  }
}
