import { RatePricingType } from "~/utils/enum";
import { roundMoney } from "~/utils/money";

export type RateForPricing = {
  pricingType: RatePricingType;
  basePrice: number;
  baseDurationMinutes: number;
  additionalHourPrice: number;
  roundingMinutes: number;
  checkOutGraceMinutes: number;
};

export type RoomChargeBreakdown = {
  pricingType: RatePricingType;
  durationMinutes: number;
  /** Minutes billed beyond the base block, after grace and rounding. */
  extraBilledMinutes: number;
  /** Number of days billed (daily plans only). */
  billedDays: number;
  roomAmount: number;
};

export type BillAdjustments = {
  discountAmount: number;
  surchargeAmount: number;
  penaltyAmount: number;
};

const MINUTES_PER_DAY = 24 * 60;

/**
 * Calculates the room amount for a stay. The backend is the only source of
 * truth for amounts; clients must never send calculated totals.
 *
 * - hourly / overnight: basePrice covers the first `baseDurationMinutes`;
 *   extra time (after `checkOutGraceMinutes`) is rounded up to
 *   `roundingMinutes` and billed pro rata at `additionalHourPrice` per hour.
 * - daily: basePrice per started 24-hour day, after `checkOutGraceMinutes`,
 *   with a minimum of one day.
 */
export function calculateRoomCharge(
  rate: RateForPricing,
  checkInAt: Date,
  checkOutAt: Date,
): RoomChargeBreakdown {
  const durationMinutes = Math.max(
    0,
    Math.ceil((checkOutAt.getTime() - checkInAt.getTime()) / 60000),
  );
  const grace = Math.max(0, rate.checkOutGraceMinutes);

  if (rate.pricingType === RatePricingType.DAILY) {
    const billedDays = Math.max(1, Math.ceil((durationMinutes - grace) / MINUTES_PER_DAY));
    return {
      pricingType: rate.pricingType,
      durationMinutes,
      extraBilledMinutes: 0,
      billedDays,
      roomAmount: roundMoney(rate.basePrice * billedDays),
    };
  }

  const baseMinutes = Math.max(0, rate.baseDurationMinutes);
  const rounding = Math.max(1, rate.roundingMinutes);
  const extraMinutes = durationMinutes - baseMinutes - grace;
  const extraBilledMinutes = extraMinutes > 0 ? Math.ceil(extraMinutes / rounding) * rounding : 0;

  return {
    pricingType: rate.pricingType,
    durationMinutes,
    extraBilledMinutes,
    billedDays: 0,
    roomAmount: roundMoney(rate.basePrice + (rate.additionalHourPrice * extraBilledMinutes) / 60),
  };
}

/** total = room - discount + surcharge + penalty (docs/features/billing.md). */
export function calculateTotal(roomAmount: number, adj: BillAdjustments): number {
  return roundMoney(
    roomAmount - adj.discountAmount + adj.surchargeAmount + adj.penaltyAmount,
  );
}
