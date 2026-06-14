import { BalanceRepository } from '../repositories/balances.repository';
import { Prisma } from '@prisma/client';

export class BalanceService {
  private repo = new BalanceRepository();

  async getGroupBalances(groupId: string) {
    const expenses = await this.repo.getGroupExpenses(groupId);
    const settlements = await this.repo.getGroupSettlements(groupId);
    const members = await this.repo.getGroupMembers(groupId);

    const balances = new Map<string, { userId: string; name: string; paid: number; owed: number; settlementsPaid: number; settlementsReceived: number; netBalance: number }>();

    for (const m of members) {
      balances.set(m.userId, { userId: m.userId, name: m.user.name, paid: 0, owed: 0, settlementsPaid: 0, settlementsReceived: 0, netBalance: 0 });
    }

    for (const exp of expenses) {
      const convertedAmount = Number(exp.convertedAmount || exp.amount);

      // Amount paid
      const payer = balances.get(exp.paidById);
      if (payer) payer.paid += convertedAmount;

      // Amount owed
      for (const p of exp.participants) {
        const participant = balances.get(p.userId);
        if (participant) participant.owed += Number(p.computedOweAmount);
      }
    }

    for (const st of settlements) {
      const convertedAmount = Number(st.convertedAmount || st.amount);
      
      const payer = balances.get(st.fromUserId);
      if (payer) payer.settlementsPaid += convertedAmount;

      const receiver = balances.get(st.toUserId);
      if (receiver) receiver.settlementsReceived += convertedAmount;
    }

    // Calculate net
    for (const b of balances.values()) {
      b.netBalance = (b.paid - b.owed) + (b.settlementsPaid - b.settlementsReceived);
      // Clean up small floating point artifacts
      b.netBalance = Math.round(b.netBalance * 100) / 100;
    }

    return Array.from(balances.values());
  }

  async getUserBreakdown(groupId: string, userId: string) {
    const expenses = await this.repo.getGroupExpenses(groupId);
    const settlements = await this.repo.getGroupSettlements(groupId);
    const members = await this.repo.getGroupMembers(groupId);

    const member = members.find(m => m.userId === userId);
    if (!member) throw new Error('User is not a member of this group');

    const breakdown = [];
    let netBalance = 0;

    for (const exp of expenses) {
      const convertedAmount = Number(exp.convertedAmount || exp.amount);
      
      if (exp.paidById === userId) {
        breakdown.push({ type: 'EXPENSE_PAID', description: exp.description, amount: convertedAmount, date: exp.date });
        netBalance += convertedAmount;
      }

      const participantShare = exp.participants.find(p => p.userId === userId);
      if (participantShare) {
        const oweAmount = Number(participantShare.computedOweAmount);
        breakdown.push({ type: 'EXPENSE_OWED', description: exp.description, amount: -oweAmount, date: exp.date });
        netBalance -= oweAmount;
      }
    }

    for (const st of settlements) {
      const convertedAmount = Number(st.convertedAmount || st.amount);

      if (st.fromUserId === userId) {
        breakdown.push({ type: 'SETTLEMENT_PAID', description: `Paid to ${st.toUser.name}`, amount: convertedAmount, date: st.date });
        netBalance += convertedAmount;
      }

      if (st.toUserId === userId) {
        breakdown.push({ type: 'SETTLEMENT_RECEIVED', description: `Received from ${st.fromUser.name}`, amount: -convertedAmount, date: st.date });
        netBalance -= convertedAmount;
      }
    }

    // Sort by date
    breakdown.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      user: member.user.name,
      balance: Math.round(netBalance * 100) / 100,
      breakdown: breakdown.map(b => ({ expense: b.description, amount: b.amount, type: b.type }))
    };
  }
}
