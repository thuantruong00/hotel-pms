import { AppError } from "~/errors";
import { RoomStayStatus } from "~/utils/enum";

/** Allowed RoomStay transitions (docs/features/reservation-and-room-stay.md). */
export const ROOM_STAY_TRANSITIONS: Record<RoomStayStatus, RoomStayStatus[]> = {
  [RoomStayStatus.RESERVED]: [
    RoomStayStatus.CHECKED_IN,
    RoomStayStatus.CANCELLED,
    RoomStayStatus.NO_SHOW,
  ],
  [RoomStayStatus.CHECKED_IN]: [RoomStayStatus.CHECKED_OUT],
  [RoomStayStatus.CHECKED_OUT]: [],
  [RoomStayStatus.CANCELLED]: [],
  [RoomStayStatus.NO_SHOW]: [],
};

export const canTransition = (from: RoomStayStatus, to: RoomStayStatus) =>
  ROOM_STAY_TRANSITIONS[from]?.includes(to) ?? false;

export function assertTransition(from: RoomStayStatus, to: RoomStayStatus) {
  if (!canTransition(from, to)) {
    throw AppError.conflict(
      "INVALID_STAY_STATUS",
      `Cannot change room stay status from ${from} to ${to}`,
      { currentStatus: from, targetStatus: to },
    );
  }
}
