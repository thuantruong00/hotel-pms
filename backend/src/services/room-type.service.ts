import { RoomType } from "~/entities/room-type.entity";
import { AppError } from "~/errors";
import { roomTypeRepository } from "~/repositories/room-type.repository";

export type RoomTypeInput = {
  code: string;
  name: string;
  capacity: number;
  bedCount: number;
  bedType?: string | null;
  description?: string | null;
  isActive?: boolean;
};

const notFound = () => AppError.notFound("ROOM_TYPE_NOT_FOUND", "The room type does not exist");

async function assertCodeFree(code: string, exceptId?: string) {
  const existing = await roomTypeRepository.findByCode(code);
  if (existing && existing.roomTypeId !== exceptId) {
    throw AppError.conflict("ROOM_TYPE_CODE_EXISTS", "The room type code is already in use");
  }
}

export const roomTypeService = {
  list: (filter: { isActive?: boolean }) => roomTypeRepository.list(filter),

  async getById(roomTypeId: string) {
    const roomType = await roomTypeRepository.findById(roomTypeId);
    if (!roomType) throw notFound();
    return roomType;
  },

  async create(input: RoomTypeInput) {
    await assertCodeFree(input.code);
    return roomTypeRepository.save({
      code: input.code,
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
    if (input.code && input.code !== roomType.code) await assertCodeFree(input.code, roomTypeId);

    const changes: Partial<RoomType> = { roomTypeId };
    for (const key of ["code", "name", "capacity", "bedCount", "bedType", "description", "isActive"] as const) {
      if (input[key] !== undefined) (changes as any)[key] = input[key];
    }
    await roomTypeRepository.save(changes);
    return roomTypeRepository.findById(roomTypeId);
  },
};
