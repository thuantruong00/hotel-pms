import { RoomRatePlan } from "~/entities/room-rate-plan.entity";
import { AppError } from "~/errors";
import { runInTransaction } from "~/repositories/db";
import { roomRateRepository } from "~/repositories/room-rate.repository";
import { roomTypeRepository } from "~/repositories/room-type.repository";
import { RatePricingType } from "~/utils/enum";
import { toMoneyString } from "~/utils/money";

export type RoomRateInput = {
  code: string;
  name: string;
  pricingType: RatePricingType;
  basePrice: number;
  baseDurationMinutes?: number;
  additionalHourPrice?: number;
  defaultCheckInTime?: string | null;
  defaultCheckOutTime?: string | null;
  resetTime?: string | null;
  checkInGraceMinutes?: number;
  checkOutGraceMinutes?: number;
  roundingMinutes?: number;
  validFrom?: string | null;
  validTo?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
};

const notFound = () => AppError.notFound("RATE_NOT_FOUND", "The room rate does not exist");

const defaultBaseDuration = (type: RatePricingType) =>
  type === RatePricingType.HOURLY ? 60 : type === RatePricingType.OVERNIGHT ? 720 : 1440;

function assertValidity(validFrom?: string | null, validTo?: string | null) {
  if (validFrom && validTo && validTo < validFrom) {
    throw AppError.unprocessable("INVALID_DATE_RANGE", "validTo must not be earlier than validFrom");
  }
}

function toEntityFields(input: Partial<RoomRateInput>): Partial<RoomRatePlan> {
  const out: Partial<RoomRatePlan> = {};
  const copy = [
    "code",
    "name",
    "pricingType",
    "baseDurationMinutes",
    "defaultCheckInTime",
    "defaultCheckOutTime",
    "resetTime",
    "checkInGraceMinutes",
    "checkOutGraceMinutes",
    "roundingMinutes",
    "validFrom",
    "validTo",
    "isDefault",
    "isActive",
  ] as const;
  for (const key of copy) {
    if (input[key] !== undefined) (out as any)[key] = input[key];
  }
  if (input.basePrice !== undefined) out.basePrice = toMoneyString(input.basePrice);
  if (input.additionalHourPrice !== undefined) {
    out.additionalHourPrice = toMoneyString(input.additionalHourPrice);
  }
  return out;
}

export const roomRateService = {
  async listByRoomType(roomTypeId: string, filter: { isActive?: boolean }) {
    const roomType = await roomTypeRepository.findById(roomTypeId);
    if (!roomType) throw AppError.notFound("ROOM_TYPE_NOT_FOUND", "The room type does not exist");
    return roomRateRepository.listByRoomType(roomTypeId, filter);
  },

  async getById(rateId: string) {
    const rate = await roomRateRepository.findById(rateId);
    if (!rate) throw notFound();
    return rate;
  },

  async create(roomTypeId: string, input: RoomRateInput) {
    const roomType = await roomTypeRepository.findById(roomTypeId);
    if (!roomType) throw AppError.notFound("ROOM_TYPE_NOT_FOUND", "The room type does not exist");
    assertValidity(input.validFrom, input.validTo);
    if (await roomRateRepository.findByCode(roomTypeId, input.code)) {
      throw AppError.conflict("RATE_CODE_EXISTS", "The rate code already exists for this room type");
    }

    return runInTransaction(async (db) => {
      const saved = await roomRateRepository.save(
        {
          ...toEntityFields(input),
          roomTypeId,
          baseDurationMinutes: input.baseDurationMinutes ?? defaultBaseDuration(input.pricingType),
        },
        db,
      );
      if (saved.isDefault) await roomRateRepository.clearDefault(roomTypeId, saved.ratePlanId, db);
      return roomRateRepository.findById(saved.ratePlanId, db);
    });
  },

  async update(rateId: string, input: Partial<RoomRateInput>) {
    const rate = await roomRateRepository.findById(rateId);
    if (!rate) throw notFound();
    assertValidity(
      input.validFrom !== undefined ? input.validFrom : rate.validFrom,
      input.validTo !== undefined ? input.validTo : rate.validTo,
    );
    if (input.code && input.code !== rate.code) {
      if (await roomRateRepository.findByCode(rate.roomTypeId, input.code)) {
        throw AppError.conflict("RATE_CODE_EXISTS", "The rate code already exists for this room type");
      }
    }

    // Finalized bills keep their own snapshot on RoomStayCharge, so editing a
    // rate never changes historical bills.
    return runInTransaction(async (db) => {
      await roomRateRepository.save({ ...toEntityFields(input), ratePlanId: rateId }, db);
      if (input.isDefault) await roomRateRepository.clearDefault(rate.roomTypeId, rateId, db);
      return roomRateRepository.findById(rateId, db);
    });
  },
};
