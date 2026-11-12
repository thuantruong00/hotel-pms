import { RoomStay } from "~/entities/room-stay.entity";
import { RoomStayCharge } from "~/entities/room-stay-charge.entity";
import { RoomStayCustomer } from "~/entities/room-stay-customer.entity";
import { RoomStayStatus } from "~/utils/enum";
import { PageQuery, toSkip } from "~/utils/pagination";
import { Db, defaultDb } from "./db";

export type RoomStayListFilter = PageQuery & {
  status?: RoomStayStatus;
  roomId?: string;
  customerId?: string;
  /** Stays whose planned range overlaps [from, to). */
  from?: Date;
  to?: Date;
};

const detailRelations = {
  room: { roomType: true },
  ratePlan: true,
  guests: { customer: true },
  charge: true,
} as const;

export const roomStayRepository = {
  findById: (id: string, db: Db = defaultDb()) =>
    db.getRepository(RoomStay).findOne({ where: { stayId: id } }),

  findDetailById: (id: string, db: Db = defaultDb()) =>
    db.getRepository(RoomStay).findOne({ where: { stayId: id }, relations: detailRelations }),

  /** Locks the stay row for a state transition. */
  findByIdForUpdate: (id: string, db: Db) =>
    db
      .getRepository(RoomStay)
      .createQueryBuilder("stay")
      .setLock("pessimistic_write")
      .where("stay.stayId = :id", { id })
      .getOne(),

  /** Returns the first active stay of the room overlapping [checkInAt, checkOutAt). */
  findOverlapping: (
    roomId: string,
    checkInAt: Date,
    checkOutAt: Date,
    db: Db = defaultDb(),
    excludeStayId?: string,
  ) => {
    const qb = db
      .getRepository(RoomStay)
      .createQueryBuilder("s")
      .where("s.roomId = :roomId", { roomId })
      .andWhere("s.plannedCheckInAt < :checkOutAt", { checkOutAt })
      .andWhere(
        `((s.status = :reserved AND s.plannedCheckOutAt > :checkInAt)
          OR (s.status = :checkedIn AND GREATEST(s.planned_check_out_at, now()) > :checkInAt))`,
        {
          checkInAt,
          reserved: RoomStayStatus.RESERVED,
          checkedIn: RoomStayStatus.CHECKED_IN,
        },
      );
    if (excludeStayId) qb.andWhere("s.stayId <> :excludeStayId", { excludeStayId });
    return qb.getOne();
  },

  findCheckedInForRoom: (roomId: string, db: Db = defaultDb(), excludeStayId?: string) => {
    const qb = db
      .getRepository(RoomStay)
      .createQueryBuilder("s")
      .where("s.roomId = :roomId", { roomId })
      .andWhere("s.status = :status", { status: RoomStayStatus.CHECKED_IN });
    if (excludeStayId) qb.andWhere("s.stayId <> :excludeStayId", { excludeStayId });
    return qb.getOne();
  },

  list: (f: RoomStayListFilter, db: Db = defaultDb()) => {
    const qb = db
      .getRepository(RoomStay)
      .createQueryBuilder("stay")
      .leftJoinAndSelect("stay.room", "room")
      .leftJoinAndSelect("stay.guests", "guest")
      .leftJoinAndSelect("guest.customer", "customer")
      .leftJoinAndSelect("stay.charge", "charge")
      .orderBy("stay.plannedCheckInAt", "DESC")
      .skip(toSkip(f))
      .take(f.limit);

    if (f.status) qb.andWhere("stay.status = :status", { status: f.status });
    if (f.roomId) qb.andWhere("stay.roomId = :roomId", { roomId: f.roomId });
    if (f.customerId) {
      qb.andWhere(
        "EXISTS (SELECT 1 FROM room_stay_customers rsc WHERE rsc.stay_id = stay.stay_id AND rsc.customer_id = :customerId)",
        { customerId: f.customerId },
      );
    }
    if (f.from) qb.andWhere("stay.plannedCheckOutAt > :from", { from: f.from });
    if (f.to) qb.andWhere("stay.plannedCheckInAt < :to", { to: f.to });
    return qb.getManyAndCount();
  },

  save: (stay: Partial<RoomStay>, db: Db = defaultDb()) => db.getRepository(RoomStay).save(stay),

  // ─── Stay customers ───────────────────────────────────────────────
  listCustomers: (stayId: string, db: Db = defaultDb()) =>
    db.getRepository(RoomStayCustomer).find({ where: { stayId } }),

  saveCustomers: (links: Partial<RoomStayCustomer>[], db: Db = defaultDb()) =>
    db.getRepository(RoomStayCustomer).save(links),

  clearPrimaryCustomer: (stayId: string, db: Db = defaultDb()) =>
    db.getRepository(RoomStayCustomer).update({ stayId, isPrimary: true }, { isPrimary: false }),

  // ─── Charge ───────────────────────────────────────────────────────
  findCharge: (stayId: string, db: Db = defaultDb()) =>
    db.getRepository(RoomStayCharge).findOne({ where: { stayId } }),

  findChargeForUpdate: (stayId: string, db: Db) =>
    db
      .getRepository(RoomStayCharge)
      .createQueryBuilder("charge")
      .setLock("pessimistic_write")
      .where("charge.stayId = :stayId", { stayId })
      .getOne(),

  saveCharge: (charge: Partial<RoomStayCharge>, db: Db = defaultDb()) =>
    db.getRepository(RoomStayCharge).save(charge),
};
