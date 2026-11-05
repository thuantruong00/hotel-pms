import z from "zod";
import {
  isoDate,
  nonEmptyPatch,
  optionalText,
  paginationQuery,
  queryBoolean,
  uuid,
} from "./common.schema";

const identityShape = {
  identityType: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Use lowercase snake_case, e.g. citizen_id, passport"),
  identityNumber: z.string().trim().min(1).max(50),
  nameOnDocument: optionalText(150),
  nationality: optionalText(80),
  dateOfBirth: isoDate().nullable().optional(),
  issuedDate: isoDate().nullable().optional(),
  expiryDate: isoDate().nullable().optional(),
};

const identityDateRule = (v: { issuedDate?: string | null; expiryDate?: string | null }) =>
  !v.issuedDate || !v.expiryDate || v.expiryDate >= v.issuedDate;

const identitySchema = z
  .strictObject(identityShape)
  .refine(identityDateRule, { message: "expiryDate must not be earlier than issuedDate", path: ["expiryDate"] });

const email = () => z.email().max(150).nullable().optional();
const phone = () =>
  z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\-.\s]*$/, "Invalid phone number")
    .nullable()
    .optional();

export const createCustomerBodySchema = z.strictObject({
  fullName: optionalText(150),
  phone: phone(),
  email: email(),
  notes: optionalText(2000),
  identity: identitySchema.optional(),
});

export const updateCustomerBodySchema = nonEmptyPatch({
  fullName: optionalText(150),
  phone: phone(),
  email: email(),
  notes: optionalText(2000),
  isActive: z.boolean().optional(),
});

export const addIdentityBodySchema = z
  .strictObject({ ...identityShape, replacesIdentityId: uuid().optional() })
  .refine(identityDateRule, { message: "expiryDate must not be earlier than issuedDate", path: ["expiryDate"] });

export const listCustomersQuerySchema = z.strictObject({
  ...paginationQuery,
  search: z.string().trim().min(1).max(100).optional(),
  isActive: queryBoolean().optional(),
});

export const customerIdParamSchema = z.strictObject({ customerId: uuid() });
