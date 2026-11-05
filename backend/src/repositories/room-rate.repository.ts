import { RoomRatePlan } from "~/entities/room-rate-plan.entity";
import { Db, defaultDb } from "./db";

export const roomRateRepository = {
  findById: (id: string, db: Db = defaultDb()) =>
    db.getRepository(RoomRatePlan).findOne({ where: { ratePlanId: id } }),

  findByCode: (roomTypeId: string, code: string, db: Db = defaultDb()) =>
    db.getRepository(RoomRatePlan).findOne({ where: { roomTypeId, code } }),

  listByRoomType: (
    roomTypeId: string,
    filter: { isActive?: boolean },
    db: Db = defaultDb(),
  ) =>
    db.getRepository(RoomRatePlan).find({
      where:
        filter.isActive === undefined
          ? { roomTypeId }
          : { roomTypeId, isActive: filter.isActive },
      order: { isDefault: "DESC", name: "ASC" },
    }),

  /** Clears the default flag on other plans of the room type. */
  clearDefault: (roomTypeId: string, exceptRatePlanId: string, db: Db = defaultDb()) =>
    db
      .getRepository(RoomRatePlan)
      .createQueryBuilder()
      .update()
      .set({ isDefault: false })
      .where("room_type_id = :roomTypeId AND rate_plan_id <> :id AND is_default = true", {
        roomTypeId,
        id: exceptRatePlanId,
      })
      .execute(),

  save: (plan: Partial<RoomRatePlan>, db: Db = defaultDb()) =>
    db.getRepository(RoomRatePlan).save(plan),
};
