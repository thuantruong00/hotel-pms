/** Rounds a monetary value to 2 decimals (numeric(12,2) columns). */
export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const toMoneyString = (value: number): string => roundMoney(value).toFixed(2);

export const fromMoney = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};
