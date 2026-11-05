import { Room } from "~/entities/room.entity";
import { AppError } from "~/errors";
import { roomRepository, RoomListFilter } from "~/repositories/room.repository";
import { roomTypeRepository } from "~/repositories/room-type.repository";
import { RoomStatus } from "~/utils/enum";

export type CreateRoomInput = {
  roomTypeId: string;
  roomNumber: string;
  floor?: number | null;
  status?: RoomStatus;
  notes?: string | null;
  isActive?: boolean;
};

export type UpdateRoomInput = Partial<CreateRoomInput>;

export type AvailabilityQuery = {
  checkInAt: Date;
  checkOutAt: Date;
  roomTypeId?: string;
  guestCount?: number;
};

const notFound = () => AppError.notFound("ROOM_NOT_FOUND", "The room does not exist");

async function assertRoomTypeExists(roomTypeId: string) {
  const roomType = await roomTypeRepository.findById(roomTypeId);
  if (!roomType) throw AppError.notFound("ROOM_TYPE_NOT_FOUND", "The room type does not exist");
  return roomType;
}

async function assertNumberFree(roomNumber: string, exceptId?: string) {
  const existing = await roomRepository.findByNumber(roomNumber);
  if (existing && existing.roomId !== exceptId) {
    throw AppError.conflict("ROOM_NUMBER_EXISTS", "The room number is already in use");
  }
}

export function assertValidRange(checkInAt: Date, checkOutAt: Date) {
  if (checkOutAt.getTime() <= checkInAt.getTime()) {
    throw AppError.unprocessable("INVALID_DATE_RANGE", "Check-out must be later than check-in");
  }
}

export const roomService = {
  list: (filter: RoomListFilter) => roomRepository.list(filter),

  async getById(roomId: string) {
    const room = await roomRepository.findById(roomId);
    if (!room) throw notFound();
    return room;
  },

  async create(input: CreateRoomInput) {
    await assertRoomTypeExists(input.roomTypeId);
    await assertNumberFree(input.roomNumber);
    const room = await roomRepository.save({
      roomTypeId: input.roomTypeId,
      roomNumber: input.roomNumber,
      floor: input.floor ?? null,
      status: input.status ?? RoomStatus.AVAILABLE,
      notes: input.notes ?? null,
      isActive: input.isActive ?? true,
    });
    return roomRepository.findById(room.roomId);
  },

  async update(roomId: string, input: UpdateRoomInput) {
    const room = await roomRepository.findById(roomId);
    if (!room) throw notFound();
    if (input.roomTypeId && input.roomTypeId !== room.roomTypeId) {
      await assertRoomTypeExists(input.roomTypeId);
    }
    if (input.roomNumber && input.roomNumber !== room.roomNumber) {
      await assertNumberFree(input.roomNumber, roomId);
    }

    const changes: Partial<Room> = { roomId };
    for (const key of ["roomTypeId", "roomNumber", "floor", "status", "notes", "isActive"] as const) {
      if (input[key] !== undefined) (changes as any)[key] = input[key];
    }
    await roomRepository.save(changes);
    return roomRepository.findById(roomId);
  },

  /**
   * Availability is computed from date-range overlap of active stays, not
   * from the manually stored room status (docs/features/room-management.md).
   */
  async availability(q: AvailabilityQuery) {
    assertValidRange(q.checkInAt, q.checkOutAt);
    const rooms = await roomRepository.findAvailable({
      checkInAt: q.checkInAt,
      checkOutAt: q.checkOutAt,
      roomTypeId: q.roomTypeId,
      minCapacity: q.guestCount,
    });
    return {
      checkInAt: q.checkInAt,
      checkOutAt: q.checkOutAt,
      rooms,
    };
  },
};
