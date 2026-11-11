import { env } from "~/utils/env";
import { logger } from "~/utils/logger";
import { userService } from "../user.service";

/** Startup initialization. With INIT=1, creates the first admin if none exists. */
export const initialService = async () => {
  if (!Number(env.INIT)) {
    logger.debug("Init service: skip");
    return;
  }

  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    logger.warn("INIT=1 but ADMIN_USERNAME / ADMIN_PASSWORD are not set; skipping admin seed");
    return;
  }
  if (env.ADMIN_PASSWORD.length < 8) {
    logger.warn("ADMIN_PASSWORD must be at least 8 characters; skipping admin seed");
    return;
  }

  const created = await userService.ensureInitialAdmin(env.ADMIN_USERNAME, env.ADMIN_PASSWORD);
  logger.info(created ? `Initial admin "${created.username}" created` : "Admin already exists; skip seed");
};
