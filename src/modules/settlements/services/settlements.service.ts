import { SettlementRepository } from '../repositories/settlements.repository';
import { MembershipRepository } from '../../memberships/repositories/memberships.repository';
import { CreateSettlementDto } from '../dtos/settlements.dto';
import { getExchangeRate, convertToBaseCurrency } from '../../../config/currency.config';
import { Prisma } from '@prisma/client';

export class SettlementService {
  private settlementRepo = new SettlementRepository();
  private membershipRepo = new MembershipRepository();

  async createSettlement(data: CreateSettlementDto, requesterId: string, tx?: Prisma.TransactionClient) {
    // 1. Verify group membership of requester
    const requesterMembership = await this.membershipRepo.findMembership(data.groupId, requesterId);
    if (!requesterMembership) throw new Error('Forbidden: You must be a member of the group');

    // 2. Verify both payer and receiver are members of the group
    const payerMembership = await this.membershipRepo.findMembership(data.groupId, data.fromUserId);
    const receiverMembership = await this.membershipRepo.findMembership(data.groupId, data.toUserId);

    if (!payerMembership || !receiverMembership) {
      throw new Error('Both the payer and receiver must be members of the group');
    }

    // 3. Compute currency exchange
    const exchangeRate = getExchangeRate(data.currency || 'INR');
    const convertedAmount = convertToBaseCurrency(data.amount, data.currency || 'INR');

    // 4. Save to repository with audit fields
    return this.settlementRepo.create({
      amount: data.amount,
      currency: data.currency || 'INR',
      exchangeRate,
      convertedAmount,
      date: new Date(data.date),
      group: { connect: { id: data.groupId } },
      fromUser: { connect: { id: data.fromUserId } },
      toUser: { connect: { id: data.toUserId } },
      createdBy: { connect: { id: requesterId } }
    }, tx);
  }

  async getSettlement(id: string) {
    const settlement = await this.settlementRepo.findById(id);
    if (!settlement || settlement.deletedAt) throw new Error('Settlement not found');
    return settlement;
  }

  async listGroupSettlements(groupId: string, requesterId: string) {
    const requesterMembership = await this.membershipRepo.findMembership(groupId, requesterId);
    if (!requesterMembership) throw new Error('Forbidden: You must be a member of the group');

    return this.settlementRepo.findGroupSettlements(groupId);
  }

  async deleteSettlement(id: string, requesterId: string) {
    const settlement = await this.settlementRepo.findById(id);
    if (!settlement || settlement.deletedAt) throw new Error('Settlement not found');

    const requesterMembership = await this.membershipRepo.findMembership(settlement.groupId, requesterId);
    if (!requesterMembership) throw new Error('Forbidden: You must be a member of the group');

    // Soft delete to maintain audit trail
    return this.settlementRepo.softDelete(id);
  }
}
