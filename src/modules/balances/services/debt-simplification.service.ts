import { BalanceService } from './balances.service';

export class DebtSimplificationService {
  private balanceService = new BalanceService();

  async getSimplifiedBalances(groupId: string) {
    const balances = await this.balanceService.getGroupBalances(groupId);

    // netBalance > 0 means the user is owed money (creditor)
    // netBalance < 0 means the user owes money (debtor)
    
    const creditors = balances.filter(b => b.netBalance > 0.01).map(b => ({ ...b }));
    const debtors = balances.filter(b => b.netBalance < -0.01).map(b => ({ ...b }));

    // Sort by magnitude descending to minimize transactions
    creditors.sort((a, b) => b.netBalance - a.netBalance);
    debtors.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));

    let c = 0;
    let d = 0;
    const transactions = [];

    while (c < creditors.length && d < debtors.length) {
      const creditor = creditors[c];
      const debtor = debtors[d];

      const amountToSettle = Math.min(creditor.netBalance, Math.abs(debtor.netBalance));
      
      transactions.push({
        from: debtor.name,
        fromUserId: debtor.userId,
        to: creditor.name,
        toUserId: creditor.userId,
        amount: Math.round(amountToSettle * 100) / 100
      });

      creditor.netBalance -= amountToSettle;
      debtor.netBalance += amountToSettle;

      if (creditor.netBalance < 0.01) c++;
      if (Math.abs(debtor.netBalance) < 0.01) d++;
    }

    return transactions;
  }
}
