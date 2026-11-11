import { Router } from "express";
import { Permission as P } from "~/config/permissions";
import {
  authController,
  billingController,
  customerController,
  roomController,
  roomRateController,
  roomStayController,
  roomTypeController,
  userController,
  workSessionController,
} from "~/controllers";
import { requireAuthentication as auth, requirePermission as can, validate } from "~/middlewares";
import {
  createUserBodySchema,
  listUsersQuerySchema,
  loginBodySchema,
  updateUserBodySchema,
} from "~/validators/auth.schema";
import { emptyBody } from "~/validators/common.schema";
import {
  addIdentityBodySchema,
  createCustomerBodySchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  updateCustomerBodySchema,
} from "~/validators/customer.schema";
import {
  availabilityQuerySchema,
  createRoomBodySchema,
  createRoomRateBodySchema,
  createRoomTypeBodySchema,
  listRoomRatesQuerySchema,
  listRoomsQuerySchema,
  listRoomTypesQuerySchema,
  roomIdParamSchema,
  roomRateIdParamSchema,
  roomTypeIdParamSchema,
  updateRoomBodySchema,
  updateRoomRateBodySchema,
  updateRoomTypeBodySchema,
} from "~/validators/room.schema";
import {
  addStayCustomersBodySchema,
  createRoomStayBodySchema,
  finalizeBillBodySchema,
  listRoomStaysQuerySchema,
  listSessionStaysQuerySchema,
  markPaidBodySchema,
  sessionIdParamSchema,
  stayActionBodySchema,
  stayIdParamSchema,
} from "~/validators/room-stay.schema";
import z from "zod";

export const apiRouter = Router();

// ─── Auth ─────────────────────────────────────────────────────────
apiRouter.post("/auth/login", validate({ body: loginBodySchema }), authController.login);
apiRouter.get("/auth/me", auth, authController.me);

// ─── Users (admin) ────────────────────────────────────────────────
const userIdParam = z.strictObject({ userId: z.uuid() });
apiRouter.get("/users", auth, can(P.USERS_MANAGE), validate({ query: listUsersQuerySchema }), userController.list);
apiRouter.post("/users", auth, can(P.USERS_MANAGE), validate({ body: createUserBodySchema }), userController.create);
apiRouter.patch(
  "/users/:userId",
  auth,
  can(P.USERS_MANAGE),
  validate({ params: userIdParam, body: updateUserBodySchema }),
  userController.update,
);

// ─── Customers ────────────────────────────────────────────────────
apiRouter.post(
  "/customers",
  auth,
  can(P.CUSTOMERS_WRITE),
  validate({ body: createCustomerBodySchema }),
  customerController.create,
);
apiRouter.get(
  "/customers",
  auth,
  can(P.CUSTOMERS_READ),
  validate({ query: listCustomersQuerySchema }),
  customerController.list,
);
apiRouter.get(
  "/customers/:customerId",
  auth,
  can(P.CUSTOMERS_READ),
  validate({ params: customerIdParamSchema }),
  customerController.getById,
);
apiRouter.patch(
  "/customers/:customerId",
  auth,
  can(P.CUSTOMERS_WRITE),
  validate({ params: customerIdParamSchema, body: updateCustomerBodySchema }),
  customerController.update,
);
apiRouter.post(
  "/customers/:customerId/identities",
  auth,
  can(P.CUSTOMERS_WRITE),
  validate({ params: customerIdParamSchema, body: addIdentityBodySchema }),
  customerController.addIdentity,
);

// ─── Room types & rates ───────────────────────────────────────────
apiRouter.get(
  "/room-types",
  auth,
  can(P.ROOMS_READ),
  validate({ query: listRoomTypesQuerySchema }),
  roomTypeController.list,
);
apiRouter.post(
  "/room-types",
  auth,
  can(P.ROOM_TYPES_WRITE),
  validate({ body: createRoomTypeBodySchema }),
  roomTypeController.create,
);
apiRouter.patch(
  "/room-types/:roomTypeId",
  auth,
  can(P.ROOM_TYPES_WRITE),
  validate({ params: roomTypeIdParamSchema, body: updateRoomTypeBodySchema }),
  roomTypeController.update,
);
apiRouter.get(
  "/room-types/:roomTypeId/rates",
  auth,
  can(P.ROOMS_READ),
  validate({ params: roomTypeIdParamSchema, query: listRoomRatesQuerySchema }),
  roomRateController.listByRoomType,
);
apiRouter.post(
  "/room-types/:roomTypeId/rates",
  auth,
  can(P.ROOM_RATES_WRITE),
  validate({ params: roomTypeIdParamSchema, body: createRoomRateBodySchema }),
  roomRateController.create,
);
apiRouter.get(
  "/room-rates/:rateId",
  auth,
  can(P.ROOMS_READ),
  validate({ params: roomRateIdParamSchema }),
  roomRateController.getById,
);
apiRouter.patch(
  "/room-rates/:rateId",
  auth,
  can(P.ROOM_RATES_WRITE),
  validate({ params: roomRateIdParamSchema, body: updateRoomRateBodySchema }),
  roomRateController.update,
);

// ─── Rooms ────────────────────────────────────────────────────────
// `/rooms/availability` must be registered before `/rooms/:roomId`.
apiRouter.get(
  "/rooms/availability",
  auth,
  can(P.ROOMS_READ),
  validate({ query: availabilityQuerySchema }),
  roomController.availability,
);
apiRouter.get("/rooms", auth, can(P.ROOMS_READ), validate({ query: listRoomsQuerySchema }), roomController.list);
apiRouter.get(
  "/rooms/:roomId",
  auth,
  can(P.ROOMS_READ),
  validate({ params: roomIdParamSchema }),
  roomController.getById,
);
apiRouter.post("/rooms", auth, can(P.ROOMS_WRITE), validate({ body: createRoomBodySchema }), roomController.create);
apiRouter.patch(
  "/rooms/:roomId",
  auth,
  can(P.ROOMS_WRITE),
  validate({ params: roomIdParamSchema, body: updateRoomBodySchema }),
  roomController.update,
);

// ─── Room stays ───────────────────────────────────────────────────
apiRouter.post(
  "/room-stays",
  auth,
  can(P.ROOM_STAYS_WRITE),
  validate({ body: createRoomStayBodySchema }),
  roomStayController.create,
);
apiRouter.get(
  "/room-stays",
  auth,
  can(P.ROOM_STAYS_READ),
  validate({ query: listRoomStaysQuerySchema }),
  roomStayController.list,
);
apiRouter.get(
  "/room-stays/:stayId",
  auth,
  can(P.ROOM_STAYS_READ),
  validate({ params: stayIdParamSchema }),
  roomStayController.getById,
);
apiRouter.post(
  "/room-stays/:stayId/check-in",
  auth,
  can(P.ROOM_STAYS_WRITE),
  validate({ params: stayIdParamSchema, body: emptyBody }),
  roomStayController.checkIn,
);
apiRouter.post(
  "/room-stays/:stayId/check-out",
  auth,
  can(P.ROOM_STAYS_WRITE),
  validate({ params: stayIdParamSchema, body: emptyBody }),
  roomStayController.checkOut,
);
apiRouter.post(
  "/room-stays/:stayId/cancel",
  auth,
  can(P.ROOM_STAYS_WRITE),
  validate({ params: stayIdParamSchema, body: stayActionBodySchema }),
  roomStayController.cancel,
);
apiRouter.post(
  "/room-stays/:stayId/no-show",
  auth,
  can(P.ROOM_STAYS_WRITE),
  validate({ params: stayIdParamSchema, body: stayActionBodySchema }),
  roomStayController.noShow,
);
apiRouter.post(
  "/room-stays/:stayId/customers",
  auth,
  can(P.ROOM_STAYS_WRITE),
  validate({ params: stayIdParamSchema, body: addStayCustomersBodySchema }),
  roomStayController.addCustomers,
);

// ─── Billing ──────────────────────────────────────────────────────
apiRouter.get(
  "/room-stays/:stayId/bill",
  auth,
  can(P.BILLING_READ),
  validate({ params: stayIdParamSchema }),
  billingController.getBill,
);
apiRouter.post(
  "/room-stays/:stayId/bill/finalize",
  auth,
  can(P.BILLING_WRITE),
  validate({ params: stayIdParamSchema, body: finalizeBillBodySchema }),
  billingController.finalize,
);
apiRouter.post(
  "/room-stays/:stayId/bill/mark-paid",
  auth,
  can(P.BILLING_WRITE),
  validate({ params: stayIdParamSchema, body: markPaidBodySchema }),
  billingController.markPaid,
);

// ─── Work sessions ────────────────────────────────────────────────
apiRouter.post(
  "/work-sessions/open",
  auth,
  can(P.WORK_SESSIONS_WRITE),
  validate({ body: emptyBody }),
  workSessionController.open,
);
apiRouter.get("/work-sessions/current", auth, can(P.WORK_SESSIONS_READ), workSessionController.current);
apiRouter.post(
  "/work-sessions/:sessionId/close",
  auth,
  can(P.WORK_SESSIONS_WRITE),
  validate({ params: sessionIdParamSchema, body: emptyBody }),
  workSessionController.close,
);
apiRouter.get(
  "/work-sessions/:sessionId/room-stays",
  auth,
  can(P.WORK_SESSIONS_READ),
  validate({ params: sessionIdParamSchema, query: listSessionStaysQuerySchema }),
  workSessionController.listRoomStays,
);
