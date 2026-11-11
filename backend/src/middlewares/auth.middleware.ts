import { NextFunction, Request, Response } from "express";
import { hasPermission } from "~/config/roleAccess";
import { AppError } from "~/errors";
import { authService } from "~/services/auth.service";

const readBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
};

/**
 * Authenticates the request from the bearer token. The user, role, and status
 * are always loaded from the database, never trusted from the token payload or
 * the client.
 */
export const requireAuthentication = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = readBearerToken(req);
    if (!token) throw AppError.unauthorized();

    req.user = await authService.authenticateToken(token);
    next();
  } catch (err) {
    next(err);
  }
};

/** Requires every listed permission. Must run after `requireAuthentication`. */
export const requirePermission =
  (...permissions: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());

    const allowed = permissions.every((p) => hasPermission(req.user!.role, p));
    if (!allowed) return next(AppError.forbidden());
    next();
  };
