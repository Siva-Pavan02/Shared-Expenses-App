import { ExpenseRepository } from '../repositories/expenses.repository';
import { SplitEngineService } from './split-engine.service';
import { MembershipRepository } from '../../memberships/repositories/memberships.repository';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expenses.dto';
import { getExchangeRate, convertToBaseCurrency } from '../../../config/currency.config';
import { Prisma } from '@prisma/client';

export class ExpenseService {
  private expenseRepo = new ExpenseRepository();
  private splitEngine = new SplitEngineService();
  private membershipRepo = new MembershipRepository();

  async createExpense(data: CreateExpenseDto, requesterId: string, tx?: Prisma.TransactionClient) {
    // 1. Verify group membership of requester
    const requesterMembership = await this.membershipRepo.findMembership(data.groupId, requesterId);
    if (!requesterMembership) throw new Error('Forbidden: You must be a member of the group');

    // 2. Fetch active members on the expense date
    const expenseDate = new Date(data.date);
    const allMembers = await this.membershipRepo.getGroupMembers(data.groupId);
    
    const activeMemberIds = allMembers
      .filter(m => m.joinedAt <= expenseDate && (!m.leftAt || m.leftAt >= expenseDate))
      .map(m => m.userId);

    console.log('2. Service - activeMemberIds:', activeMemberIds);
    console.log('2. Service - paidById fallback:', data.paidById || requesterId);
    console.log('2. Service - data.participants before splits:', JSON.stringify(data.participants));

    // 3. Compute the splits using hardcoded exchange rates
    const exchangeRate = getExchangeRate(data.currency || 'INR');
    const convertedAmount = convertToBaseCurrency(data.amount, data.currency || 'INR');

    const splits = this.splitEngine.calculateSplits(
      data.amount,
      exchangeRate,
      data.splitType,
      data.participants,
      activeMemberIds
    );

    console.log('3. Service - splits returned:', JSON.stringify(splits));

    // 4. Save to repository
    return this.expenseRepo.createWithParticipants({
      amount: data.amount,
      currency: data.currency || 'INR',
      exchangeRate,
      convertedAmount,
      description: data.description,
      date: expenseDate,
      splitType: data.splitType,
      group: { connect: { id: data.groupId } },
      paidBy: { connect: { id: data.paidById || requesterId } }
    }, splits, tx);
  }

  async getExpense(id: string) {
    const expense = await this.expenseRepo.findById(id);
    if (!expense) throw new Error('Expense not found');
    return expense;
  }

  async listGroupExpenses(groupId: string, requesterId: string) {
    const requesterMembership = await this.membershipRepo.findMembership(groupId, requesterId);
    if (!requesterMembership) throw new Error('Forbidden: You must be a member of the group');

    return this.expenseRepo.findGroupExpenses(groupId);
  }

  async deleteExpense(id: string) {
    return this.expenseRepo.delete(id);
  }
}
