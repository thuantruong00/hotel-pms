import { RoomType } from "~/entities/room-type.entity";
import { Db, defaultDb } from "./db";

export const roomTypeRepository = {
  findById: (id: string, db: Db = defaultDb()) =>
    db.getRepository(RoomType).findOne({ where: { roomTypeId: id } }),

  findByCode: (code: string, db: Db = defaultDb()) =>
    db.getRepository(RoomType).findOne({ where: { code } }),

  list: (filter: { isActive?: boolean }, db: Db = defaultDb()) =>
    db.getRepository(RoomType).find({
      where: filter.isActive === undefined ? {} : { isActive: filter.isActive },
      order: { name: "ASC" },
    }),

  save: (roomType: Partial<RoomType>, db: Db = defaultDb()) =>
    db.getRepository(RoomType).save(roomType),
};
