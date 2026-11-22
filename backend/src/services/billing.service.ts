import { calculateRoomCharge, calculateTotal, RateForPricing } from "~/domain/pricing";
import { RoomRatePlan } from "~/entities/room-rate-plan.entity";
import { RoomStay } from "~/entities/room-stay.entity";
import { AppError } from "~/errors";
import { Db, defaultDb, runInTransaction } from "~/repositories/db";
import { roomRateRepository } from "~/repositories/room-rate.repository";
import { roomRepository } from "~/repositories/room.repository";
import { roomStayRepository } from "~/repositories/room-stay.repository";
import { PaymentMethod, RoomStatus, RoomStayStatus } from "~/utils/enum";
import { fromMoney, toMoneyString } from "~/utils/money";
import { AuthUser } from "./auth.service";

export type FinalizeBillInput = {
  discountAmount?: number;
  surchargeAmount?: number;
  penaltyAmount?: number;
  penaltyReason?: string | null;
  paymentMethod?: PaymentMethod;
};

export type MarkPaidInput = {
  paymentMethod?: PaymentMethod;
};

const stayNotFound = () => AppError.notFound("ROOM_STAY_NOT_FOUND", "The room stay does not exist");

export const toRateForPricing = (plan: RoomRatePlan): RateForPricing => ({
  pricingType: plan.pricingType,
  basePrice: fromMoney(plan.basePrice),
  baseDurationMinutes: plan.baseDurationMinutes,
  additionalHourPrice: fromMoney(plan.additionalHourPrice),
  roundingMinutes: plan.roundingMinutes,
  checkOutGraceMinutes: plan.checkOutGraceMinutes,
});

/** Billing period: actual times when known, otherwise planned (or now while checked in). */
export function billingPeriod(stay: RoomStay, now = new Date()) {
  const checkInAt = stay.actualCheckInAt ?? stay.plannedCheckInAt;
  const checkOutAt =
    stay.actualCheckOutAt ??
    (stay.status === RoomStayStatus.CHECKED_IN ? now : stay.plannedCheckOutAt);
  return { checkInAt, checkOutAt };
}

async function loadRate(stay: RoomStay, db: Db) {
  if (!stay.ratePlanId) throw AppError.conflict("RATE_NOT_FOUND", "The room stay has no room rate");
  const rate = await roomRateRepository.findById(stay.ratePlanId, db);
  if (!rate) throw AppError.conflict("RATE_NOT_FOUND", "The room rate of the stay no longer exists");
  return rate;
}

/** Calculates the room amount for a stay from its rate plan. */
export async function calculateStayRoomCharge(stay: RoomStay, db: Db = defaultDb(), now = new Date()) {
  const rate = await loadRate(stay, db);
  const { checkInAt, checkOutAt } = billingPeriod(stay, now);
  return { rate, checkInAt, checkOutAt, breakdown: calculateRoomCharge(toRateForPricing(rate), checkInAt, checkOutAt) };
}

const rateSnapshot = (rate: RoomRatePlan) => ({
  ratePlanId: rate.ratePlanId,
  roomTypeId: rate.roomTypeId,
  name: rate.name,
  pricingType: rate.pricingType,
  basePrice: rate.basePrice,
  baseDurationMinutes: rate.baseDurationMinutes,
  additionalHourPrice: rate.additionalHourPrice,
  roundingMinutes: rate.roundingMinutes,
  checkInGraceMinutes: rate.checkInGraceMinutes,
  checkOutGraceMinutes: rate.checkOutGraceMinutes,
  defaultCheckInTime: rate.defaultCheckInTime,
  defaultCheckOutTime: rate.defaultCheckOutTime,
});

export const billingService = {
  /** Returns the finalized bill, or a calculated preview when not finalized yet. */
  async getBill(stayId: string) {
    const stay = await roomStayRepository.findById(stayId);
    if (!stay) throw stayNotFound();

    const charge = await roomStayRepository.findCharge(stayId);
    if (charge) {
      return {
        stayId,
        finalized: true,
        totalAmount: charge.amount,
        isPaid: charge.isPaid,
        paymentMethod: charge.paymentMethod,
        paidAt: charge.paidAt,
        paidByUserId: charge.paidByUserId,
        snapshot: charge.snapshot,
        chargeId: charge.chargeId,
      };
    }

    if ([RoomStayStatus.CANCELLED, RoomStayStatus.NO_SHOW].includes(stay.status)) {
      return { stayId, finalized: false, status: stay.status, preview: null };
    }

    const { checkInAt, checkOutAt, breakdown } = await calculateStayRoomCharge(stay);
    const adjustments = {
      discountAmount: fromMoney(stay.discountAmount),
      surchargeAmount: fromMoney(stay.surchargeAmount),
      penaltyAmount: fromMoney(stay.penaltyAmount),
    };
    return {
      stayId,
      finalized: false,
      status: stay.status,
      preview: {
        checkInAt,
        checkOutAt,
        ...breakdown,
        roomAmount: toMoneyString(breakdown.roomAmount),
        discountAmount: toMoneyString(adjustments.discountAmount),
        surchargeAmount: toMoneyString(adjustments.surchargeAmount),
        penaltyAmount: toMoneyString(adjustments.penaltyAmount),
        totalAmount: toMoneyString(calculateTotal(breakdown.roomAmount, adjustments)),
      },
    };
  },

  /** Calculates the final bill and stores it with an immutable rate snapshot. */
  finalize: (stayId: string, input: FinalizeBillInput, user: AuthUser) =>
    runInTransaction(async (db) => {
      const stay = await roomStayRepository.findByIdForUpdate(stayId, db);
      if (!stay) throw stayNotFound();
      if (![RoomStayStatus.CHECKED_IN, RoomStayStatus.CHECKED_OUT].includes(stay.status)) {
        throw AppError.conflict(
          "INVALID_STAY_STATUS",
          "The bill can only be finalized while the guest is checked in or after check-out",
          { currentStatus: stay.status },
        );
      }
      if (await roomStayRepository.findCharge(stayId, db)) {
        throw AppError.conflict("BILL_ALREADY_FINALIZED", "The bill has already been finalized");
      }

      const { rate, checkInAt, checkOutAt, breakdown } = await calculateStayRoomCharge(stay, db);
      const adjustments = {
        discountAmount: input.discountAmount ?? fromMoney(stay.discountAmount),
        surchargeAmount: input.surchargeAmount ?? fromMoney(stay.surchargeAmount),
        penaltyAmount: input.penaltyAmount ?? fromMoney(stay.penaltyAmount),
      };
      const totalAmount = calculateTotal(breakdown.roomAmount, adjustments);
      if (totalAmount < 0) {
        throw AppError.unprocessable("INVALID_BILL_AMOUNT", "The bill total cannot be negative");
      }

      const now = new Date();
      stay.roomAmount = toMoneyString(breakdown.roomAmount);
      stay.discountAmount = toMoneyString(adjustments.discountAmount);
      stay.surchargeAmount = toMoneyString(adjustments.surchargeAmount);
      stay.penaltyAmount = toMoneyString(adjustments.penaltyAmount);
      if (input.penaltyReason !== undefined) stay.penaltyReason = input.penaltyReason;
      stay.totalAmount = toMoneyString(totalAmount);
      stay.calculatedAt = now;
      await roomStayRepository.save(stay, db);

      const charge = await roomStayRepository.saveCharge(
        {
          stayId,
          amount: toMoneyString(totalAmount),
          paymentMethod: input.paymentMethod ?? PaymentMethod.CASH,
          isPaid: false,
          snapshot: {
            rate: rateSnapshot(rate),
            period: { checkInAt, checkOutAt },
            calculation: breakdown,
            amounts: {
              roomAmount: stay.roomAmount,
              discountAmount: stay.discountAmount,
              surchargeAmount: stay.surchargeAmount,
              penaltyAmount: stay.penaltyAmount,
              penaltyReason: stay.penaltyReason,
              totalAmount: stay.totalAmount,
            },
            finalizedAt: now,
            finalizedByUserId: user.userId,
          },
        },
        db,
      );
      return charge;
    }),

  /** Marks the bill as paid and records the confirming employee. */
  markPaid: (stayId: string, input: MarkPaidInput, user: AuthUser) =>
    runInTransaction(async (db) => {
      const stay = await roomStayRepository.findByIdForUpdate(stayId, db);
      if (!stay) throw stayNotFound();

      const charge = await roomStayRepository.findChargeForUpdate(stayId, db);
      if (!charge) {
        throw AppError.conflict("BILL_NOT_FINALIZED", "The bill must be finalized before payment");
      }
      if (charge.isPaid) throw AppError.conflict("BILL_ALREADY_PAID", "The bill has already been paid");

      charge.isPaid = true;
      charge.paymentMethod = input.paymentMethod ?? charge.paymentMethod ?? PaymentMethod.CASH;
      charge.paidAt = new Date();
      // Derived from the authenticated context, never from the client.
      charge.paidByUserId = user.userId;
      await roomStayRepository.saveCharge(charge, db);

      // Payment completes the stay. Keep already checked-out stays compatible
      // with the old flow, while the new flow checks out checked-in stays here.
      if (stay.status === RoomStayStatus.CHECKED_IN) {
        stay.status = RoomStayStatus.CHECKED_OUT;
        stay.actualCheckOutAt = new Date();
        await roomStayRepository.save(stay, db);
        await roomRepository.updateStatus(stay.roomId, RoomStatus.CLEANING, db);
      }

      return charge;
    }),

  /** Finalizes, pays, and checks out a checked-in stay atomically. */
  checkoutAndPay: (stayId: string, input: FinalizeBillInput, user: AuthUser) =>
    runInTransaction(async (db) => {
      const stay = await roomStayRepository.findByIdForUpdate(stayId, db);
      if (!stay) throw stayNotFound();
      if (stay.status !== RoomStayStatus.CHECKED_IN) {
        throw AppError.conflict("INVALID_STAY_STATUS", "Only a checked-in stay can be paid and checked out", {
          currentStatus: stay.status,
        });
      }
      if (await roomStayRepository.findCharge(stayId, db)) {
        throw AppError.conflict("BILL_ALREADY_FINALIZED", "The bill has already been created");
      }

      const now = new Date();
      const { rate, checkInAt, breakdown } = await calculateStayRoomCharge(stay, db, now);
      const adjustments = {
        discountAmount: input.discountAmount ?? fromMoney(stay.discountAmount),
        surchargeAmount: input.surchargeAmount ?? fromMoney(stay.surchargeAmount),
        penaltyAmount: input.penaltyAmount ?? fromMoney(stay.penaltyAmount),
      };
      const totalAmount = calculateTotal(breakdown.roomAmount, adjustments);
      if (totalAmount < 0) {
        throw AppError.unprocessable("INVALID_BILL_AMOUNT", "The bill total cannot be negative");
      }

      stay.status = RoomStayStatus.CHECKED_OUT;
      stay.actualCheckOutAt = now;
      stay.roomAmount = toMoneyString(breakdown.roomAmount);
      stay.discountAmount = toMoneyString(adjustments.discountAmount);
      stay.surchargeAmount = toMoneyString(adjustments.surchargeAmount);
      stay.penaltyAmount = toMoneyString(adjustments.penaltyAmount);
      if (input.penaltyReason !== undefined) stay.penaltyReason = input.penaltyReason;
      stay.totalAmount = toMoneyString(totalAmount);
      stay.calculatedAt = now;
      await roomStayRepository.save(stay, db);

      const charge = await roomStayRepository.saveCharge({
        stayId,
        amount: toMoneyString(totalAmount),
        paymentMethod: input.paymentMethod ?? PaymentMethod.CASH,
        isPaid: true,
        paidAt: now,
        paidByUserId: user.userId,
        snapshot: {
          rate: rateSnapshot(rate),
          period: { checkInAt, checkOutAt: now },
          calculation: breakdown,
          amounts: {
            roomAmount: stay.roomAmount,
            discountAmount: stay.discountAmount,
            surchargeAmount: stay.surchargeAmount,
            penaltyAmount: stay.penaltyAmount,
            penaltyReason: stay.penaltyReason,
            totalAmount: stay.totalAmount,
          },
          finalizedAt: now,
          finalizedByUserId: user.userId,
          paidAt: now,
          paidByUserId: user.userId,
        },
      }, db);

      await roomRepository.updateStatus(stay.roomId, RoomStatus.CLEANING, db);
      return charge;
    }),
};
