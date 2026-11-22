import { RoomType } from "~/entities/room-type.entity";
import { AppError } from "~/errors";
import { roomTypeRepository } from "~/repositories/room-type.repository";
import { roomRateRepository } from "~/repositories/room-rate.repository";
import { roomRepository } from "~/repositories/room.repository";

export type RoomTypeInput = {
  name: string;
  capacity: number;
  bedCount: number;
  bedType?: string | null;
  description?: string | null;
  isActive?: boolean;
};

const notFound = () => AppError.notFound("ROOM_TYPE_NOT_FOUND", "The room type does not exist");

export const roomTypeService = {
  list: (filter: { isActive?: boolean }) => roomTypeRepository.list(filter),

  async getById(roomTypeId: string) {
    const roomType = await roomTypeRepository.findById(roomTypeId);
    if (!roomType) throw notFound();
    return roomType;
  },

  async create(input: RoomTypeInput) {
    return roomTypeRepository.save({
      name: input.name,
      capacity: input.capacity,
      bedCount: input.bedCount,
      bedType: input.bedType ?? null,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
    });
  },

  async update(roomTypeId: string, input: Partial<RoomTypeInput>) {
    const roomType = await roomTypeRepository.findById(roomTypeId);
    if (!roomType) throw notFound();
    const changes: Partial<RoomType> = { roomTypeId };
    for (const key of ["name", "capacity", "bedCount", "bedType", "description", "isActive"] as const) {
      if (input[key] !== undefined) (changes as any)[key] = input[key];
    }
    await roomTypeRepository.save(changes);
    return roomTypeRepository.findById(roomTypeId);
  },

  async remove(roomTypeId: string) {
    const roomType = await roomTypeRepository.findById(roomTypeId);
    if (!roomType) throw notFound();

    const [roomCount, rateCount] = await Promise.all([
      roomRepository.countByRoomTypeId(roomTypeId),
      roomRateRepository.countByRoomTypeId(roomTypeId),
    ]);
    if (roomCount > 0 || rateCount > 0) {
      throw AppError.conflict("ROOM_TYPE_IN_USE", "The room type cannot be deleted while rooms or rates are attached", {
        roomCount,
        rateCount,
      });
    }

    await roomTypeRepository.remove(roomTypeId);
  },
};
