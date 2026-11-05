import { Request, Response, NextFunction } from "express";
import { UserRole } from "~/utils/enum";
import { RoleAccess } from "~/config";
import { env } from "~/utils";

type DTOConfig = {
  body?: new () => any;
  query?: new () => any;
  params?: new () => any;
};

function normalizeRole(value: unknown): UserRole | null {
  switch (value) {
    case UserRole.STAFF:
    case "user":
      return UserRole.STAFF;
    case UserRole.MANAGER:
      return UserRole.MANAGER;
    case UserRole.ADMIN:
    case "root":
      return UserRole.ADMIN;
    case UserRole.GUEST:
      return UserRole.GUEST;
    default:
      return null;
  }
}

export class Middleware {
  protected userRole: string;

  constructor(userRole = "guest") {
    this.userRole = userRole;
  }

  APImiddleware(
    pageCode: string,
    opts?: {
      allowedRole?: UserRole[];
      bypass?: boolean;
      authMethods?: AuthMethod[];
    },
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (opts?.bypass) return next();

        const auth = await resolveApiAuth(req, opts?.authMethods ?? ["session"]);
        const currentRole = auth.success ? auth.role : UserRole.GUEST;

        const access = checkAccess({
          role: currentRole,
          pageCode,
          allowedRole: opts?.allowedRole ?? [
            UserRole.STAFF,
            UserRole.MANAGER,
            UserRole.ADMIN,
          ],
        });

        if (!access.allowed) {
          if (!auth.success) {
            const statusCode = auth.reason === "forbidden" ? 403 : 401;
            return res.status(statusCode).json({
              error: {
                code: statusCode === 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
                message:
                  statusCode === 401
                    ? "Authentication is required."
                    : "The user account is not allowed to access this resource.",
              },
            });
          }
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to perform this operation.",
            },
          });
        }

        if (auth.success) {
          req.user = auth.user;
        }
        res.locals.mode = "json";
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

export function checkAccess(options: {
  role: UserRole | string;
  pageCode: string;
  allowedRole?: Array<UserRole | string>;
}): { allowed: boolean; reason?: "unauthenticated" | "unauthorized" } {
  const role = normalizeRole(options.role);
  const { pageCode, allowedRole } = options;
  const denyReason =
    role === UserRole.GUEST || role === null
      ? "unauthenticated"
      : "unauthorized";

  if (!role || role === UserRole.GUEST) {
    return { allowed: false, reason: denyReason };
  }

  const routerBaseAllowed =
    !allowedRole || allowedRole.length === 0
      ? true
      : allowedRole.some((item) => normalizeRole(item) === role);

  const allowList = RoleAccess.allow?.[role] ?? [];
  const blockList = RoleAccess.block?.[role] ?? [];

  const hasCustomAllow =
    allowList.includes("*") || allowList.includes(pageCode);
  const hasCustomBlock =
    blockList.includes("*") || blockList.includes(pageCode);

  if (hasCustomBlock) {
    return {
      allowed: false,
      reason: denyReason,
    };
  }

  if (!routerBaseAllowed) {
    return {
      allowed: false,
      reason: denyReason,
    };
  }

  const hasAllowConfiguration = Object.prototype.hasOwnProperty.call(
    RoleAccess.allow ?? {},
    role,
  );

  if (hasAllowConfiguration && !hasCustomAllow) {
    return { allowed: false, reason: denyReason };
  }

  return { allowed: true };
}

type AuthResult =
  | { success: true; method: string; role: UserRole; user: any }
  | { success: false; reason: "unauthenticated" | "forbidden" };

type AuthMethod = "session" | "basic" | "apiKey" | "bearer";

export async function resolveApiAuth(
  req: Request,
  methods: AuthMethod[] = ["session"],
): Promise<AuthResult> {
  for (const method of methods) {
    switch (method) {
      case "session": {
        const sessionUser = req.session?.user;
        if (sessionUser?.user_id) {
          const role = normalizeRole(sessionUser.role);
          if (!role || role === UserRole.GUEST) {
            return { success: false, reason: "forbidden" };
          }

          if (sessionUser.status && sessionUser.status !== "active") {
            return { success: false, reason: "forbidden" };
          }

          return {
            success: true,
            method: "session",
            role,
            user: sessionUser,
          };
        }
        break;
      }

      case "basic": {
        const auth = req.headers.authorization;
        if (auth?.startsWith("Basic ")) {
          const base64 = auth.split(" ")[1];
          const decoded = Buffer.from(base64, "base64").toString("utf8");
          const [username, password] = decoded.split(":");

          if (
            username === env.BASIC_AUTH_USERNAME &&
            password === env.BASIC_AUTH_PASSWORD
          ) {
            return {
              success: true,
              method: "basic",
              role: UserRole.ADMIN,
              user: { username, role: UserRole.ADMIN, status: "active" },
            };
          }
        }
        break;
      }

      // case "apiKey": {
      //   const key =
      //     req.headers["x-api-key"]?.toString() || req.query.api_key?.toString();
      //   if (key && key === INTERNAL_API_KEY) {
      //     return {
      //       success: true,
      //       method: "apiKey",
      //       role: UserRole.ROOT,
      //       user: { apiKey: key, role: UserRole.ROOT },
      //     };
      //   }
      //   break;
      // }

      // case "bearer": {
      //   const auth = req.headers.authorization;
      //   if (auth?.startsWith("Bearer ")) {
      //     const token = auth.split(" ")[1];
      //     try {
      //       const payload = await jwtVerifyToken(token);
      //       return {
      //         success: true,
      //         method: "bearer",
      //         role: payload.role,
      //         user: payload,
      //       };
      //     } catch (e) {
      //     }
      //   }
      //   break;
      // }
    }
  }

  return {
    success: false,
    reason: "unauthenticated",
  };
}
