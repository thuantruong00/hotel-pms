import z from "zod";
import { PagiLimit, PagiMaxLimit } from "~/utils/const";

export const uuid = () => z.uuid({ message: "Must be a valid UUID" });

/** ISO 8601 datetime with timezone offset, parsed to Date. */
export const isoDateTime = () =>
  z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const isoDate = () => z.iso.date();

export const timeOfDay = () =>
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Must be HH:mm or HH:mm:ss");

export const money = () =>
  z
    .number()
    .min(0)
    .max(9_999_999_999.99)
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "At most 2 decimals");

export const queryBoolean = () =>
  z.enum(["true", "false"]).transform((value) => value === "true");

export const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(PagiMaxLimit).default(PagiLimit),
};

type Shape = NonNullable<Parameters<typeof z.strictObject>[0]>;

/** Strict PATCH body that requires at least one field. */
export const nonEmptyPatch = <T extends Shape>(shape: T) =>
  z
    .strictObject(shape)
    .refine(
      (value) => Object.keys(value as object).length > 0,
      "At least one field must be provided",
    );

export const emptyBody = z.strictObject({});
