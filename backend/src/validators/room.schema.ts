import z from "zod";
import { RatePricingType, RoomStatus } from "~/utils/enum";
import {
  isoDate,
  isoDateTime,
  money,
  nonEmptyPatch,
  optionalText,
  queryBoolean,
  timeOfDay,
  uuid,
} from "./common.schema";

// ─── Room types ───────────────────────────────────────────────────
const roomTypeShape = {
  code: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Only letters, digits, underscore, and dash"),
  name: z.string().trim().min(1).max(100),
  capacity: z.number().int().min(1).max(50),
  bedCount: z.number().int().min(0).max(20),
  bedType: optionalText(50),
  description: optionalText(2000),
  isActive: z.boolean().optional(),
};

export const createRoomTypeBodySchema = z.strictObject({
  ...roomTypeShape,
  bedCount: roomTypeShape.bedCount.default(1),
});

export const updateRoomTypeBodySchema = nonEmptyPatch({
  code: roomTypeShape.code.optional(),
  name: roomTypeShape.name.optional(),
  capacity: roomTypeShape.capacity.optional(),
  bedCount: roomTypeShape.bedCount.optional(),
  bedType: roomTypeShape.bedType,
  description: roomTypeShape.description,
  isActive: roomTypeShape.isActive,
});

export const listRoomTypesQuerySchema = z.strictObject({ isActive: queryBoolean().optional() });

export const roomTypeIdParamSchema = z.strictObject({ roomTypeId: uuid() });

// ─── Rooms ────────────────────────────────────────────────────────
const roomShape = {
  roomTypeId: uuid(),
  roomNumber: z.string().trim().min(1).max(20),
  floor: z.number().int().min(-10).max(500).nullable().optional(),
  status: z.enum(RoomStatus).optional(),
  notes: optionalText(2000),
  isActive: z.boolean().optional(),
};

export const createRoomBodySchema = z.strictObject(roomShape);

export const updateRoomBodySchema = nonEmptyPatch({
  roomTypeId: roomShape.roomTypeId.optional(),
  roomNumber: roomShape.roomNumber.optional(),
  floor: roomShape.floor,
  status: roomShape.status,
  notes: roomShape.notes,
  isActive: roomShape.isActive,
});

export const listRoomsQuerySchema = z.strictObject({
  roomTypeId: uuid().optional(),
  status: z.enum(RoomStatus).optional(),
  floor: z.coerce.number().int().optional(),
  isActive: queryBoolean().optional(),
});

export const roomIdParamSchema = z.strictObject({ roomId: uuid() });

export const availabilityQuerySchema = z.strictObject({
  checkInAt: isoDateTime(),
  checkOutAt: isoDateTime(),
  roomTypeId: uuid().optional(),
  guestCount: z.coerce.number().int().min(1).max(50).optional(),
});

// ─── Room rates ───────────────────────────────────────────────────
const minutes = (max: number) => z.number().int().min(0).max(max);

const rateShape = {
  code: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Only letters, digits, underscore, and dash"),
  name: z.string().trim().min(1).max(100),
  pricingType: z.enum(RatePricingType),
  basePrice: money(),
  baseDurationMinutes: minutes(10080).min(1).optional(),
  additionalHourPrice: money().optional(),
  defaultCheckInTime: timeOfDay().nullable().optional(),
  defaultCheckOutTime: timeOfDay().nullable().optional(),
  resetTime: timeOfDay().nullable().optional(),
  checkInGraceMinutes: minutes(1440).optional(),
  checkOutGraceMinutes: minutes(1440).optional(),
  roundingMinutes: z.number().int().min(1).max(1440).optional(),
  validFrom: isoDate().nullable().optional(),
  validTo: isoDate().nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

export const createRoomRateBodySchema = z.strictObject(rateShape);

export const updateRoomRateBodySchema = nonEmptyPatch({
  ...rateShape,
  code: rateShape.code.optional(),
  name: rateShape.name.optional(),
  pricingType: rateShape.pricingType.optional(),
  basePrice: rateShape.basePrice.optional(),
});

export const listRoomRatesQuerySchema = z.strictObject({ isActive: queryBoolean().optional() });

export const roomRateIdParamSchema = z.strictObject({ rateId: uuid() });
