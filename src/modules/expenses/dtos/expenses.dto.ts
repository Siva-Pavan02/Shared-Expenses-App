export interface SplitDetailDto {
  userId: string;
  value?: number; // Raw input (e.g., 2 shares, 500 exact, 30 percentage). Null/undefined for EQUAL.
}

export interface CreateExpenseDto {
  groupId: string;
  description: string;
  amount: number; // originalAmount
  currency: string;
  exchangeRate?: number;
  date: string;
  splitType: 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE' | 'SHARE';
  participants: SplitDetailDto[];
  paidById?: string;
}

export interface UpdateExpenseDto {
  description?: string;
  amount?: number;
  currency?: string;
  exchangeRate?: number;
  date?: string;
  splitType?: 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE' | 'SHARE';
  participants?: SplitDetailDto[];
}
