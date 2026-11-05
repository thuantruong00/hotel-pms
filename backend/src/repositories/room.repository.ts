import { Room } from "~/entities/room.entity";
import { RoomStatus, RoomStayStatus } from "~/utils/enum";
import { Db, defaultDb } from "./db";

export type RoomListFilter = {
  roomTypeId?: string;
  status?: RoomStatus;
  floor?: number;
  isActive?: boolean;
};

export type AvailabilityFilter = {
  checkInAt: Date;
  checkOutAt: Date;
  roomTypeId?: string;
  minCapacity?: number;
};

/**
 * SQL fragment: an active stay of `room` overlaps [:checkInAt, :checkOutAt).
 * Overlap: existing.in < requested.out AND existing.out > requested.in.
 * A checked-in guest who stays past the planned check-out keeps the room
 * occupied until now, so its end is GREATEST(planned_check_out_at, now()).
 */
const OVERLAPPING_STAY_EXISTS = `EXISTS (
  SELECT 1 FROM room_stays s
  WHERE s.room_id = room.room_id
    AND s.planned_check_in_at < :checkOutAt
    AND (
      (s.status = :reserved AND s.planned_check_out_at > :checkInAt)
      OR (s.status = :checkedIn AND GREATEST(s.planned_check_out_at, now()) > :checkInAt)
    )
)`;

export const roomRepository = {
  findById: (id: string, db: Db = defaultDb()) =>
    db.getRepository(Room).findOne({ where: { roomId: id }, relations: { roomType: true } }),

  /** Locks the room row so concurrent reservations for it are serialized. */
  findByIdForUpdate: (id: string, db: Db) =>
    db
      .getRepository(Room)
      .createQueryBuilder("room")
      .setLock("pessimistic_write")
      .where("room.roomId = :id", { id })
      .getOne(),

  findByNumber: (roomNumber: string, db: Db = defaultDb()) =>
    db.getRepository(Room).findOne({ where: { roomNumber } }),

  list: (f: RoomListFilter, db: Db = defaultDb()) => {
    const qb = db
      .getRepository(Room)
      .createQueryBuilder("room")
      .leftJoinAndSelect("room.roomType", "roomType")
      .orderBy("room.floor", "ASC", "NULLS LAST")
      .addOrderBy("room.roomNumber", "ASC");

    if (f.roomTypeId) qb.andWhere("room.roomTypeId = :roomTypeId", { roomTypeId: f.roomTypeId });
    if (f.status) qb.andWhere("room.status = :status", { status: f.status });
    if (f.floor !== undefined) qb.andWhere("room.floor = :floor", { floor: f.floor });
    if (f.isActive !== undefined) qb.andWhere("room.isActive = :isActive", { isActive: f.isActive });
    return qb.getMany();
  },

  /** Active rooms without an overlapping active stay in the requested range. */
  findAvailable: (f: AvailabilityFilter, db: Db = defaultDb()) => {
    const qb = db
      .getRepository(Room)
      .createQueryBuilder("room")
      .innerJoinAndSelect("room.roomType", "roomType")
      .where("room.isActive = true")
      .andWhere("roomType.isActive = true")
      .andWhere("room.status NOT IN (:...blockedStatuses)", {
        blockedStatuses: [RoomStatus.INACTIVE, RoomStatus.OUT_OF_ORDER],
      })
      .andWhere(`NOT ${OVERLAPPING_STAY_EXISTS}`, {
        checkInAt: f.checkInAt,
        checkOutAt: f.checkOutAt,
        reserved: RoomStayStatus.RESERVED,
        checkedIn: RoomStayStatus.CHECKED_IN,
      })
      .orderBy("room.floor", "ASC", "NULLS LAST")
      .addOrderBy("room.roomNumber", "ASC");

    if (f.roomTypeId) qb.andWhere("room.roomTypeId = :roomTypeId", { roomTypeId: f.roomTypeId });
    if (f.minCapacity) qb.andWhere("roomType.capacity >= :minCapacity", { minCapacity: f.minCapacity });
    return qb.getMany();
  },

  save: (room: Partial<Room>, db: Db = defaultDb()) => db.getRepository(Room).save(room),

  updateStatus: (roomId: string, status: RoomStatus, db: Db = defaultDb()) =>
    db.getRepository(Room).update({ roomId }, { status }),
};
