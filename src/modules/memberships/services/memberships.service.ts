import { MembershipRepository } from '../repositories/memberships.repository';

export class MembershipService {
  private membershipRepo = new MembershipRepository();

  async addMember(groupId: string, targetUserId: string, requesterId: string) {
    const requester = await this.membershipRepo.findMembership(groupId, requesterId);
    if (!requester || !requester.isAdmin) throw new Error('Forbidden: Only admins can add members');

    const existing = await this.membershipRepo.findActiveMembership(groupId, targetUserId);
    if (existing) throw new Error('User is already an active member');

    return this.membershipRepo.addMember(groupId, targetUserId, new Date());
  }

  async removeMember(groupId: string, targetUserId: string, requesterId: string) {
    const requester = await this.membershipRepo.findMembership(groupId, requesterId);
    if (!requester || !requester.isAdmin) throw new Error('Forbidden: Only admins can remove members');

    const membership = await this.membershipRepo.findActiveMembership(groupId, targetUserId);
    if (!membership) throw new Error('User is not an active member');

    return this.membershipRepo.removeMember(groupId, targetUserId, new Date());
  }

  async getGroupMembers(groupId: string, requesterId: string) {
    const requester = await this.membershipRepo.findMembership(groupId, requesterId);
    if (!requester) throw new Error('Forbidden: Not a member of this group');

    return this.membershipRepo.getGroupMembers(groupId);
  }
}
