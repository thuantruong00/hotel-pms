import { WorkSession } from "~/entities/work-session.entity";
import { WorkSessionStatus } from "~/utils/enum";
import { Db, defaultDb } from "./db";

export const workSessionRepository = {
  findById: (id: string, db: Db = defaultDb()) =>
    db.getRepository(WorkSession).findOne({ where: { sessionId: id } }),

  findByIdForUpdate: (id: string, db: Db) =>
    db
      .getRepository(WorkSession)
      .createQueryBuilder("ws")
      .setLock("pessimistic_write")
      .where("ws.sessionId = :id", { id })
      .getOne(),

  findOpenByUser: (userId: string, db: Db = defaultDb()) =>
    db.getRepository(WorkSession).findOne({
      where: { userId, status: WorkSessionStatus.OPEN },
    }),

  save: (session: Partial<WorkSession>, db: Db = defaultDb()) =>
    db.getRepository(WorkSession).save(session),
};
