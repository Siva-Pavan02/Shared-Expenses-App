import { SplitEngineService } from '../src/modules/expenses/services/split-engine.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('SplitEngineService', () => {
  const engine = new SplitEngineService();

  it('distributes remainder penny correctly in EQUAL splits', () => {
    // 10.00 / 3
    const amount = 10;
    const participants = [
      { userId: 'user1' },
      { userId: 'user2' },
      { userId: 'user3' }
    ];
    const activeMemberIds = ['user1', 'user2', 'user3'];

    const result = engine.calculateSplits(amount, 1.0, 'EQUAL', participants as any, activeMemberIds);

    expect(result.length).toBe(3);
    
    // Result should be 3.34, 3.33, 3.33
    expect(result[0].computedOweAmount.toNumber()).toBe(3.34);
    expect(result[1].computedOweAmount.toNumber()).toBe(3.33);
    expect(result[2].computedOweAmount.toNumber()).toBe(3.33);

    // Sum should be exactly 10
    const sum = result.reduce((acc, p) => acc.add(p.computedOweAmount), new Decimal(0));
    expect(sum.toNumber()).toBe(10);
  });

  it('allocates multiple remainders if needed', () => {
    // 10.00 / 7
    // base: 1.42. 1.42 * 7 = 9.94. Remainder = 0.06
    const amount = 10;
    const participants = Array(7).fill(0).map((_, i) => ({ userId: `user${i}` }));
    const activeMemberIds = participants.map(p => p.userId);

    const result = engine.calculateSplits(amount, 1.0, 'EQUAL', participants as any, activeMemberIds);

    const sum = result.reduce((acc, p) => acc.add(p.computedOweAmount), new Decimal(0));
    expect(sum.toNumber()).toBe(10);

    // First 6 get 1.43, last 1 gets 1.42
    expect(result[0].computedOweAmount.toNumber()).toBe(1.43);
    expect(result[6].computedOweAmount.toNumber()).toBe(1.42);
  });
});
