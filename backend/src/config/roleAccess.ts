import fs from "fs";
import path from "path";
import defaults from "./role-access.json";

/**
 * Role access configuration (docs/api/authorization.md).
 *
 * - `pages`: frontend pages each role may see.
 * - `allow` / `block`: API permission codes; `block` always wins.
 *
 * Defaults live in `src/config/role-access.json`. A deployment may override
 * any role by placing `data/roleAccess.json` next to the app.
 */
export interface IRoleAccess {
  pages: Record<string, string[]>;
  allow: Record<string, string[]>;
  block: Record<string, string[]>;
}

const overridePath = path.resolve(process.cwd(), "data", "roleAccess.json");

const isRoleTable = (table: unknown): table is Record<string, string[]> =>
  !!table &&
  typeof table === "object" &&
  !Array.isArray(table) &&
  Object.values(table).every(
    (codes) => Array.isArray(codes) && codes.every((c) => typeof c === "string"),
  );

function readOverride(): Partial<IRoleAccess> | null {
  try {
    if (!fs.existsSync(overridePath)) return null;
    const raw = fs.readFileSync(overridePath, "utf-8").trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<IRoleAccess>;
    for (const key of ["pages", "allow", "block"] as const) {
      if (parsed[key] !== undefined && !isRoleTable(parsed[key])) {
        throw new Error(`"${key}" must map role names to string arrays`);
      }
    }
    return parsed;
  } catch (err) {
    console.error(`Invalid data/roleAccess.json, using defaults: ${(err as Error).message}`);
    return null;
  }
}

const base = defaults as IRoleAccess;
const override = readOverride();

export const RoleAccess: IRoleAccess = {
  pages: { ...base.pages, ...(override?.pages ?? {}) },
  allow: { ...base.allow, ...(override?.allow ?? {}) },
  block: { ...base.block, ...(override?.block ?? {}) },
};

/** Decides whether a role holds a permission code. */
export function hasPermission(role: string, permission: string): boolean {
  const blocked = RoleAccess.block[role] ?? [];
  if (blocked.includes("*") || blocked.includes(permission)) return false;

  const allowed = RoleAccess.allow[role] ?? [];
  return allowed.includes("*") || allowed.includes(permission);
}

/** Pages and effective permission codes for a role, sent to the frontend. */
export function accessForRole(role: string) {
  const blocked = RoleAccess.block[role] ?? [];
  return {
    pages: RoleAccess.pages[role] ?? [],
    permissions: (RoleAccess.allow[role] ?? []).filter((p) => !blocked.includes(p)),
  };
}
