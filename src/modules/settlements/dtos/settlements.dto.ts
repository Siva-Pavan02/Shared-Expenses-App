export interface CreateSettlementDto {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  date: string;
}
