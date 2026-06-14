import { Decimal } from '@prisma/client/runtime/library';
import { SplitDetailDto } from '../dtos/expenses.dto';

export class SplitEngineService {
  public calculateSplits(
    amount: number,
    exchangeRate: number,
    splitType: 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE' | 'SHARE',
    participants: SplitDetailDto[],
    activeMemberIds: string[]
  ) {
    console.log('4. SplitEngine - input participants:', JSON.stringify(participants));
    console.log('4. SplitEngine - activeMemberIds:', activeMemberIds);

    const totalAmount = new Decimal(amount).mul(exchangeRate);

    // Validate temporal membership
    for (const p of participants) {
      if (!activeMemberIds.includes(p.userId)) {
        throw new Error(`User ${p.userId} is not an active member on the expense date.`);
      }
    }

    switch (splitType) {
      case 'EQUAL':
        return this.splitEqual(totalAmount, participants);
      case 'UNEQUAL':
        return this.splitUnequal(totalAmount, participants, exchangeRate);
      case 'PERCENTAGE':
        return this.splitPercentage(totalAmount, participants);
      case 'SHARE':
        return this.splitShare(totalAmount, participants);
      default:
        throw new Error('Unsupported split type');
    }
  }

  private splitEqual(totalAmount: Decimal, participants: SplitDetailDto[]) {
    const count = participants.length;
    if (count === 0) throw new Error('Participants array is empty');
    
    // Avoid floating point errors by distributing remaining cents
    const baseShare = totalAmount.div(count).toDecimalPlaces(2, Decimal.ROUND_DOWN);
    let remaining = totalAmount.sub(baseShare.mul(count));

    return participants.map((p, index) => {
      let finalAmount = baseShare;
      if (remaining.gt(0)) {
        finalAmount = finalAmount.add(new Decimal(0.01));
        remaining = remaining.sub(new Decimal(0.01));
      }
      return {
        userId: p.userId,
        splitValue: null,
        computedOweAmount: finalAmount
      };
    });
  }

  private splitUnequal(totalAmount: Decimal, participants: SplitDetailDto[], exchangeRate: number) {
    let sum = new Decimal(0);
    const result = participants.map(p => {
      if (p.value === undefined || p.value === null) throw new Error('Exact amounts require a value for all participants');
      const inputValue = new Decimal(p.value);
      const computed = inputValue.mul(exchangeRate);
      sum = sum.add(computed);
      return { userId: p.userId, splitValue: inputValue, computedOweAmount: computed };
    });

    if (!sum.equals(totalAmount)) {
      throw new Error(`Exact amounts sum (${sum}) does not equal total expense amount (${totalAmount})`);
    }

    return result;
  }

  private splitPercentage(totalAmount: Decimal, participants: SplitDetailDto[]) {
    let percentSum = new Decimal(0);
    for (const p of participants) {
      if (p.value === undefined || p.value === null) throw new Error('Percentage split requires a value for all participants');
      percentSum = percentSum.add(p.value);
    }

    if (!percentSum.equals(100)) {
      throw new Error(`Percentages must sum to exactly 100. Current sum: ${percentSum}`);
    }

    let remaining = totalAmount;
    const result = participants.map((p, index) => {
      const isLast = index === participants.length - 1;
      const shareAmount = isLast 
        ? remaining 
        : totalAmount.mul(new Decimal(p.value!).div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      
      remaining = remaining.sub(shareAmount);

      return {
        userId: p.userId,
        splitValue: new Decimal(p.value!),
        computedOweAmount: shareAmount
      };
    });

    return result;
  }

  private splitShare(totalAmount: Decimal, participants: SplitDetailDto[]) {
    let totalShares = new Decimal(0);
    for (const p of participants) {
      if (p.value === undefined || p.value === null || p.value <= 0) throw new Error('Share split requires a positive value for all participants');
      totalShares = totalShares.add(p.value);
    }

    let remaining = totalAmount;
    const result = participants.map((p, index) => {
      const isLast = index === participants.length - 1;
      const amount = isLast 
        ? remaining 
        : totalAmount.mul(new Decimal(p.value!).div(totalShares)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      
      remaining = remaining.sub(amount);

      return {
        userId: p.userId,
        splitValue: new Decimal(p.value!),
        computedOweAmount: amount
      };
    });

    return result;
  }
}
