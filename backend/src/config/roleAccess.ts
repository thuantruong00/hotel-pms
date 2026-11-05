import fs from "fs";
import path from "path";
import { DefaultRolePermissions } from "./permissions";

/**
 * Role access configuration (docs/api/authorization.md).
 * `block` rules always take precedence over `allow` rules.
 */
export interface IRoleAccess {
  allow: Record<string, string[]>;
  block: Record<string, string[]>;
}

const roleAccessDataPath = path.resolve(process.cwd(), "data", "roleAccess.json");

const isRoleTable = (table: unknown): table is Record<string, string[]> =>
  !!table &&
  typeof table === "object" &&
  !Array.isArray(table) &&
  Object.values(table).every(
    (codes) => Array.isArray(codes) && codes.every((c) => typeof c === "string"),
  );

function readRoleAccessFromDataFile(): Partial<IRoleAccess> | null {
  try {
    if (!fs.existsSync(roleAccessDataPath)) return null;
    const raw = fs.readFileSync(roleAccessDataPath, "utf-8").trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<IRoleAccess>;
    if (parsed.allow !== undefined && !isRoleTable(parsed.allow)) return null;
    if (parsed.block !== undefined && !isRoleTable(parsed.block)) return null;
    return parsed;
  } catch {
    console.error("Invalid data/roleAccess.json, falling back to defaults");
    return null;
  }
}

const fromFile = readRoleAccessFromDataFile();

export const RoleAccess: IRoleAccess = {
  allow: { ...DefaultRolePermissions, ...(fromFile?.allow ?? {}) },
  block: { ...(fromFile?.block ?? {}) },
};

/** Decides whether a role holds a permission code. */
export function hasPermission(role: string, permission: string): boolean {
  const blocked = RoleAccess.block[role] ?? [];
  if (blocked.includes("*") || blocked.includes(permission)) return false;

  const allowed = RoleAccess.allow[role] ?? [];
  return allowed.includes("*") || allowed.includes(permission);
}
