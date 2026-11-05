import { test } from "node:test";
import assert from "node:assert/strict";
import { assertTransition, canTransition } from "./room-stay-transition";
import { RoomStayStatus as S } from "~/utils/enum";
import { AppError } from "~/errors";

test("allowed transitions", () => {
  assert.ok(canTransition(S.RESERVED, S.CHECKED_IN));
  assert.ok(canTransition(S.RESERVED, S.CANCELLED));
  assert.ok(canTransition(S.RESERVED, S.NO_SHOW));
  assert.ok(canTransition(S.CHECKED_IN, S.CHECKED_OUT));
});

test("rejected transitions raise INVALID_STAY_STATUS (409)", () => {
  for (const [from, to] of [
    [S.CHECKED_IN, S.CANCELLED],
    [S.CHECKED_OUT, S.CHECKED_IN],
    [S.CANCELLED, S.CHECKED_IN],
    [S.NO_SHOW, S.CHECKED_IN],
    [S.RESERVED, S.CHECKED_OUT],
  ] as const) {
    assert.throws(
      () => assertTransition(from, to),
      (err: unknown) =>
        err instanceof AppError && err.code === "INVALID_STAY_STATUS" && err.status === 409,
    );
  }
});
