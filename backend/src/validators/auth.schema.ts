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

/** Roles that can be assigned through the API. `root` is created only at setup. */
const assignableRole = () =>
  z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]);

export const loginBodySchema = z.strictObject({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(72),
});

export const changePasswordBodySchema = z
  .strictObject({
    currentPassword: z.string().min(1).max(72),
    newPassword: password(),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "The new password must differ from the current password",
    path: ["newPassword"],
  });

export const createUserBodySchema = z.strictObject({
  username: username(),
  displayName: optionalText(150),
  role: assignableRole(),
  status: z.enum(UserStatus).optional(),
  password: password(),
});

export const updateUserBodySchema = nonEmptyPatch({
  displayName: optionalText(150),
  role: assignableRole().optional(),
  status: z.enum(UserStatus).optional(),
  password: password().optional(),
});

export const listUsersQuerySchema = z.strictObject({ ...paginationQuery });
