import z from "zod";
import { UserRole, UserStatus } from "~/utils/enum";
import { nonEmptyPatch, optionalText, paginationQuery } from "./common.schema";

const username = () =>
  z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-zA-Z0-9._-]+$/, "Only letters, digits, dot, underscore, and dash");

const password = () => z.string().min(8).max(72);

export const loginBodySchema = z.strictObject({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(72),
});

export const createUserBodySchema = z.strictObject({
  username: username(),
  displayName: optionalText(150),
  role: z.enum(UserRole),
  status: z.enum(UserStatus).optional(),
  password: password(),
});

export const updateUserBodySchema = nonEmptyPatch({
  displayName: optionalText(150),
  role: z.enum(UserRole).optional(),
  status: z.enum(UserStatus).optional(),
  password: password().optional(),
});

export const listUsersQuerySchema = z.strictObject({ ...paginationQuery });
