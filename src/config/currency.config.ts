export const EXCHANGE_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 83.5
};

export function convertToBaseCurrency(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency.toUpperCase()];
  if (rate === undefined) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return amount * rate;
}

export function getExchangeRate(currency: string): number {
  const rate = EXCHANGE_RATES[currency.toUpperCase()];
  if (rate === undefined) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return rate;
}
