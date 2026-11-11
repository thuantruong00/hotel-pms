import { QueryFailedError } from "typeorm";
import { Permission } from "~/config/permissions";
import { hasPermission } from "~/config/roleAccess";
import { WorkSession } from "~/entities/work-session.entity";
import { AppError } from "~/errors";
import { runInTransaction } from "~/repositories/db";
import { roomStayRepository } from "~/repositories/room-stay.repository";
import { workSessionRepository } from "~/repositories/work-session.repository";
import { WorkSessionStatus } from "~/utils/enum";
import { PageQuery, paged } from "~/utils/pagination";
import { AuthUser } from "./auth.service";

const alreadyOpen = () =>
  AppError.conflict("WORK_SESSION_ALREADY_OPEN", "You already have an open work session");

const notFound = () =>
  AppError.notFound("WORK_SESSION_NOT_FOUND", "The work session does not exist");

/** The session must belong to the current employee unless they have oversight. */
function assertCanAccess(session: WorkSession, user: AuthUser) {
  if (session.userId === user.userId) return;
  if (hasPermission(user.role, Permission.WORK_SESSIONS_OVERSIGHT)) return;
  throw AppError.forbidden("WORK_SESSION_NOT_OWNED", "The work session belongs to another employee");
}

export const workSessionService = {
  async open(user: AuthUser) {
    if (await workSessionRepository.findOpenByUser(user.userId)) throw alreadyOpen();
    try {
      return await workSessionRepository.save({
        userId: user.userId,
        startedAt: new Date(),
        status: WorkSessionStatus.OPEN,
      });
    } catch (err) {
      // Partial unique index guards against concurrent opens.
      if (err instanceof QueryFailedError && (err as any).driverError?.code === "23505") {
        throw alreadyOpen();
      }
      throw err;
    }
  },

  current: (user: AuthUser) => workSessionRepository.findOpenByUser(user.userId),

  /** Closing keeps all historical room stays linked to the session. */
  close: (sessionId: string, user: AuthUser) =>
    runInTransaction(async (db) => {
      const session = await workSessionRepository.findByIdForUpdate(sessionId, db);
      if (!session) throw notFound();
      // Only the owner closes their own session.
      if (session.userId !== user.userId) {
        throw AppError.forbidden("WORK_SESSION_NOT_OWNED", "The work session belongs to another employee");
      }
      if (session.status !== WorkSessionStatus.OPEN) {
        throw AppError.conflict("WORK_SESSION_ALREADY_CLOSED", "The work session is already closed");
      }
      session.status = WorkSessionStatus.CLOSED;
      session.endedAt = new Date();
      return workSessionRepository.save(session, db);
    }),

  async listRoomStays(sessionId: string, user: AuthUser, q: PageQuery) {
    const session = await workSessionRepository.findById(sessionId);
    if (!session) throw notFound();
    assertCanAccess(session, user);
    const [stays, total] = await roomStayRepository.list({ ...q, sessionId });
    return paged(stays, total, q);
  },

  /**
   * Resolves the session a new room stay is attached to: the given session
   * must be open and owned by the user; otherwise the user's open session.
   */
  async resolveForNewStay(sessionId: string | undefined, user: AuthUser) {
    if (!sessionId) {
      const open = await workSessionRepository.findOpenByUser(user.userId);
      return open?.sessionId ?? null;
    }
    const session = await workSessionRepository.findById(sessionId);
    if (!session) throw notFound();
    if (session.userId !== user.userId) {
      throw AppError.forbidden("WORK_SESSION_NOT_OWNED", "The work session belongs to another employee");
    }
    if (session.status !== WorkSessionStatus.OPEN) {
      throw AppError.conflict("WORK_SESSION_NOT_OPEN", "The work session is not open");
    }
    return session.sessionId;
  },
};
