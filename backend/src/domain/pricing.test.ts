import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateRoomCharge, calculateTotal, RateForPricing } from "./pricing";
import { RatePricingType } from "~/utils/enum";

const at = (iso: string) => new Date(iso);

const hourly: RateForPricing = {
  pricingType: RatePricingType.HOURLY,
  basePrice: 100000,
  baseDurationMinutes: 60,
  additionalHourPrice: 50000,
  roundingMinutes: 30,
  checkOutGraceMinutes: 10,
};

test("hourly: within base block charges base price only", () => {
  const r = calculateRoomCharge(hourly, at("2026-11-05T10:00:00Z"), at("2026-11-05T11:05:00Z"));
  assert.equal(r.durationMinutes, 65);
  assert.equal(r.extraBilledMinutes, 0);
  assert.equal(r.roomAmount, 100000);
});

test("hourly: extra time is rounded up to rounding minutes", () => {
  // 2h20m = 140m; extra = 140 - 60 - 10 = 70 -> rounded to 90 -> 1.5h * 50000
  const r = calculateRoomCharge(hourly, at("2026-11-05T10:00:00Z"), at("2026-11-05T12:20:00Z"));
  assert.equal(r.extraBilledMinutes, 90);
  assert.equal(r.roomAmount, 175000);
});

test("daily: minimum one day, grace applies to each started day", () => {
  const daily: RateForPricing = { ...hourly, pricingType: RatePricingType.DAILY, basePrice: 500000, checkOutGraceMinutes: 60 };
  const short = calculateRoomCharge(daily, at("2026-11-05T14:00:00Z"), at("2026-11-05T15:00:00Z"));
  assert.equal(short.billedDays, 1);
  assert.equal(short.roomAmount, 500000);

  // 2 days + 45 minutes, inside the 60-minute grace -> 2 days
  const twoDays = calculateRoomCharge(daily, at("2026-11-05T12:00:00Z"), at("2026-11-07T12:45:00Z"));
  assert.equal(twoDays.billedDays, 2);

  // 2 days + 90 minutes -> 3 days
  const late = calculateRoomCharge(daily, at("2026-11-05T12:00:00Z"), at("2026-11-07T13:30:00Z"));
  assert.equal(late.billedDays, 3);
  assert.equal(late.roomAmount, 1500000);
});

test("negative duration is treated as zero", () => {
  const r = calculateRoomCharge(hourly, at("2026-11-05T12:00:00Z"), at("2026-11-05T10:00:00Z"));
  assert.equal(r.durationMinutes, 0);
  assert.equal(r.roomAmount, 100000);
});

test("total = room - discount + surcharge + penalty", () => {
  assert.equal(
    calculateTotal(500000, { discountAmount: 50000, surchargeAmount: 20000, penaltyAmount: 10000.5 }),
    480000.5,
  );
});
