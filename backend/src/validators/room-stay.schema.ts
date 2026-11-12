import z from "zod";
import { PaymentMethod, RoomStayStatus } from "~/utils/enum";
import { isoDateTime, money, optionalText, paginationQuery, uuid } from "./common.schema";

const stayCustomer = z.strictObject({
  customerId: uuid(),
  isPrimary: z.boolean().optional().default(false),
});

const distinctCustomers = (list: { customerId: string }[]) =>
  new Set(list.map((c) => c.customerId)).size === list.length;

const stayCustomers = () =>
  z
    .array(stayCustomer)
    .min(1, "At least one customer is required")
    .max(50)
    .refine(distinctCustomers, "A customer is listed more than once");

// The check-out > check-in rule is enforced by the service so that it returns
// the stable INVALID_DATE_RANGE error code from the API contract.
export const createRoomStayBodySchema = z.strictObject({
  roomId: uuid(),
  roomRateId: uuid(),
  plannedCheckInAt: isoDateTime(),
  plannedCheckOutAt: isoDateTime(),
  customers: stayCustomers(),
  notes: optionalText(2000),
});

export const addStayCustomersBodySchema = z.strictObject({ customers: stayCustomers() });

export const stayActionBodySchema = z.strictObject({ reason: optionalText(500) });

export const stayIdParamSchema = z.strictObject({ stayId: uuid() });

export const listRoomStaysQuerySchema = z
  .strictObject({
    ...paginationQuery,
    status: z.enum(RoomStayStatus).optional(),
    roomId: uuid().optional(),
    customerId: uuid().optional(),
    from: isoDateTime().optional(),
    to: isoDateTime().optional(),
  })
  .refine((v) => !v.from || !v.to || v.to.getTime() > v.from.getTime(), {
    message: "`to` must be later than `from`",
    path: ["to"],
  });

// ─── Billing ──────────────────────────────────────────────────────
export const finalizeBillBodySchema = z.strictObject({
  discountAmount: money().optional(),
  surchargeAmount: money().optional(),
  penaltyAmount: money().optional(),
  penaltyReason: optionalText(500),
  paymentMethod: z.enum(PaymentMethod).optional(),
});

export const markPaidBodySchema = z.strictObject({
  paymentMethod: z.enum(PaymentMethod).optional(),
});
