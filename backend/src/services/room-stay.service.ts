import { randomBytes } from "crypto";
import { assertTransition } from "~/domain/room-stay-transition";
import { calculateTotal } from "~/domain/pricing";
import { RoomStay } from "~/entities/room-stay.entity";
import { AppError } from "~/errors";
import { customerRepository } from "~/repositories/customer.repository";
import { Db, runInTransaction } from "~/repositories/db";
import { roomRateRepository } from "~/repositories/room-rate.repository";
import { roomRepository } from "~/repositories/room.repository";
import { roomStayRepository, RoomStayListFilter } from "~/repositories/room-stay.repository";
import { RoomStatus, RoomStayStatus } from "~/utils/enum";
import { fromMoney, toMoneyString } from "~/utils/money";
import { paged } from "~/utils/pagination";
import { AuthUser } from "./auth.service";
import { calculateStayRoomCharge } from "./billing.service";
import { assertValidRange } from "./room.service";

export type StayCustomerInput = { customerId: string; isPrimary?: boolean };

export type CreateRoomStayInput = {
  roomId: string;
  roomRateId: string;
  plannedCheckInAt: Date;
  plannedCheckOutAt: Date;
  customers: StayCustomerInput[];
  notes?: string | null;
};

export type StayActionInput = { reason?: string | null };

const stayNotFound = () => AppError.notFound("ROOM_STAY_NOT_FOUND", "The room stay does not exist");

function assertUniqueCustomers(customers: StayCustomerInput[]) {
  const ids = customers.map((c) => c.customerId);
  if (new Set(ids).size !== ids.length) {
    throw AppError.unprocessable("DUPLICATE_CUSTOMER", "A customer is listed more than once");
  }
}

function assertSinglePrimary(customers: StayCustomerInput[], required: boolean) {
  const primaries = customers.filter((c) => c.isPrimary).length;
  if (required && primaries === 0) {
    throw AppError.unprocessable("PRIMARY_CUSTOMER_REQUIRED", "Exactly one primary customer is required");
  }
  if (primaries > 1) {
    throw AppError.unprocessable("MULTIPLE_PRIMARY_CUSTOMERS", "Only one primary customer is allowed");
  }
}

async function assertCustomersExist(ids: string[], db: Db) {
  const found = await customerRepository.findActiveByIds(ids, db);
  const foundIds = new Set(found.map((c) => c.customerId));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw AppError.notFound("CUSTOMER_NOT_FOUND", "One or more customers do not exist");
  }
}

const isRoomUsable = (room: { isActive: boolean; status: RoomStatus }) =>
  room.isActive && room.status !== RoomStatus.INACTIVE;

const newReservationCode = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `RS${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
};

const appendNote = (notes: string | null, label: string, reason?: string | null) =>
  reason ? [notes, `[${label}] ${reason}`].filter(Boolean).join("\n") : notes;

/** Loads and locks a stay, then validates the requested transition. */
async function lockForTransition(stayId: string, target: RoomStayStatus, db: Db) {
  const stay = await roomStayRepository.findByIdForUpdate(stayId, db);
  if (!stay) throw stayNotFound();
  assertTransition(stay.status, target);
  return stay;
}

export const roomStayService = {
  async create(input: CreateRoomStayInput, user: AuthUser) {
    assertValidRange(input.plannedCheckInAt, input.plannedCheckOutAt);
    if (input.customers.length === 0) {
      throw AppError.unprocessable("CUSTOMER_REQUIRED", "At least one customer is required");
    }
    assertUniqueCustomers(input.customers);
    assertSinglePrimary(input.customers, true);

    // Signed-in users operate directly (no shift open/close flow); the stay
    // records who created it.
    const stay = await runInTransaction(async (db) => {
      // Locking the room serializes concurrent reservations of the same room.
      const room = await roomRepository.findByIdForUpdate(input.roomId, db);
      if (!room) throw AppError.notFound("ROOM_NOT_FOUND", "The room does not exist");
      if (!isRoomUsable(room)) throw AppError.conflict("ROOM_INACTIVE", "The room is not active");

      const rate = await roomRateRepository.findById(input.roomRateId, db);
      if (!rate || !rate.isActive) throw AppError.notFound("RATE_NOT_FOUND", "The room rate does not exist");
      if (rate.roomTypeId !== room.roomTypeId) {
        throw AppError.unprocessable(
          "RATE_NOT_BELONG_TO_ROOM_TYPE",
          "The room rate does not belong to the room type of the room",
        );
      }

      await assertCustomersExist(input.customers.map((c) => c.customerId), db);

      const overlap = await roomStayRepository.findOverlapping(
        room.roomId,
        input.plannedCheckInAt,
        input.plannedCheckOutAt,
        db,
      );
      if (overlap) {
        throw AppError.conflict("ROOM_ALREADY_RESERVED", "The selected room is already reserved", {
          conflictingStayId: overlap.stayId,
        });
      }

      const saved = await roomStayRepository.save(
        {
          roomId: room.roomId,
          ratePlanId: rate.ratePlanId,
          createdByUserId: user.userId,
          reservationCode: newReservationCode(),
          plannedCheckInAt: input.plannedCheckInAt,
          plannedCheckOutAt: input.plannedCheckOutAt,
          guestCount: input.customers.length,
          status: RoomStayStatus.RESERVED,
          confirmedAt: new Date(),
          notes: input.notes ?? null,
        },
        db,
      );

      await roomStayRepository.saveCustomers(
        input.customers.map((c) => ({
          stayId: saved.stayId,
          customerId: c.customerId,
          isPrimary: !!c.isPrimary,
        })),
        db,
      );
      return saved;
    });

    return { stayId: stay.stayId, status: stay.status, reservationCode: stay.reservationCode };
  },

  async list(filter: RoomStayListFilter) {
    const [stays, total] = await roomStayRepository.list(filter);
    return paged(stays, total, filter);
  },

  async getById(stayId: string) {
    const stay = await roomStayRepository.findDetailById(stayId);
    if (!stay) throw stayNotFound();
    return stay;
  },

  checkIn: (stayId: string) =>
    runInTransaction(async (db) => {
      const stay = await lockForTransition(stayId, RoomStayStatus.CHECKED_IN, db);

      const room = await roomRepository.findByIdForUpdate(stay.roomId, db);
      if (!room) throw AppError.notFound("ROOM_NOT_FOUND", "The room does not exist");
      if (!isRoomUsable(room)) throw AppError.conflict("ROOM_INACTIVE", "The room is not active");

      const occupant = await roomStayRepository.findCheckedInForRoom(room.roomId, db, stay.stayId);
      if (occupant) {
        throw AppError.conflict("ROOM_OCCUPIED", "Another guest is still checked in to this room", {
          conflictingStayId: occupant.stayId,
        });
      }

      stay.status = RoomStayStatus.CHECKED_IN;
      stay.actualCheckInAt = new Date();
      await roomStayRepository.save(stay, db);
      await roomRepository.updateStatus(room.roomId, RoomStatus.OCCUPIED, db);
      return { stayId: stay.stayId, status: stay.status, actualCheckInAt: stay.actualCheckInAt };
    }),

  checkOut: (stayId: string) =>
    runInTransaction(async (db) => {
      const stay = await lockForTransition(stayId, RoomStayStatus.CHECKED_OUT, db);

      stay.status = RoomStayStatus.CHECKED_OUT;
      stay.actualCheckOutAt = new Date();

      // Calculate the room amount on the backend; the bill is finalized separately.
      const { breakdown } = await calculateStayRoomCharge(stay, db);
      stay.roomAmount = toMoneyString(breakdown.roomAmount);
      stay.totalAmount = toMoneyString(
        calculateTotal(breakdown.roomAmount, {
          discountAmount: fromMoney(stay.discountAmount),
          surchargeAmount: fromMoney(stay.surchargeAmount),
          penaltyAmount: fromMoney(stay.penaltyAmount),
        }),
      );
      stay.calculatedAt = new Date();

      await roomStayRepository.save(stay, db);
      await roomRepository.updateStatus(stay.roomId, RoomStatus.CLEANING, db);
      return {
        stayId: stay.stayId,
        status: stay.status,
        actualCheckOutAt: stay.actualCheckOutAt,
        roomAmount: stay.roomAmount,
        totalAmount: stay.totalAmount,
      };
    }),

  cancel: (stayId: string, input: StayActionInput) =>
    runInTransaction(async (db) => {
      const stay = await lockForTransition(stayId, RoomStayStatus.CANCELLED, db);
      stay.status = RoomStayStatus.CANCELLED;
      stay.cancelledAt = new Date();
      stay.notes = appendNote(stay.notes, "cancel", input.reason);
      await roomStayRepository.save(stay, db);
      return { stayId: stay.stayId, status: stay.status, cancelledAt: stay.cancelledAt };
    }),

  noShow: (stayId: string, input: StayActionInput) =>
    runInTransaction(async (db) => {
      const stay = await lockForTransition(stayId, RoomStayStatus.NO_SHOW, db);
      stay.status = RoomStayStatus.NO_SHOW;
      stay.noShowAt = new Date();
      stay.notes = appendNote(stay.notes, "no-show", input.reason);
      await roomStayRepository.save(stay, db);
      return { stayId: stay.stayId, status: stay.status, noShowAt: stay.noShowAt };
    }),

  /** Adds customers to a reserved or checked-in stay. */
  async addCustomers(stayId: string, customers: StayCustomerInput[]) {
    assertUniqueCustomers(customers);
    assertSinglePrimary(customers, false);

    await runInTransaction(async (db) => {
      const stay: RoomStay | null = await roomStayRepository.findByIdForUpdate(stayId, db);
      if (!stay) throw stayNotFound();
      if (![RoomStayStatus.RESERVED, RoomStayStatus.CHECKED_IN].includes(stay.status)) {
        throw AppError.conflict(
          "INVALID_STAY_STATUS",
          "Customers can only be added to reserved or checked-in stays",
          { currentStatus: stay.status },
        );
      }

      const existing = await roomStayRepository.listCustomers(stayId, db);
      const existingIds = new Set(existing.map((l) => l.customerId));
      const duplicate = customers.find((c) => existingIds.has(c.customerId));
      if (duplicate) {
        throw AppError.conflict("CUSTOMER_ALREADY_IN_STAY", "The customer is already assigned to this stay", {
          customerId: duplicate.customerId,
        });
      }

      await assertCustomersExist(customers.map((c) => c.customerId), db);

      if (customers.some((c) => c.isPrimary)) {
        await roomStayRepository.clearPrimaryCustomer(stayId, db);
      }
      await roomStayRepository.saveCustomers(
        customers.map((c) => ({ stayId, customerId: c.customerId, isPrimary: !!c.isPrimary })),
        db,
      );

      stay.guestCount = existing.length + customers.length;
      await roomStayRepository.save(stay, db);
    });

    return roomStayRepository.findDetailById(stayId);
  },
};
