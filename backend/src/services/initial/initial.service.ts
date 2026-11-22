import { env } from "~/utils/env";
import { logger } from "~/utils/logger";
import { userService } from "../user.service";

/**
 * Startup initialization. With INIT=1, creates the `root` account if none
 * exists. Root is only used for initial setup: sign in as root and create the
 * owner's `super_admin` account.
 */
export const initialService = async () => {
  if (!Number(env.INIT)) {
    logger.debug("Init service: skip");
    return;
  }

  if (!env.ROOT_USERNAME || !env.ROOT_PASSWORD) {
    logger.warn("INIT=1 but ROOT_USERNAME / ROOT_PASSWORD are not set; skipping root seed");
    return;
  }
  if (env.ROOT_PASSWORD.length < 8) {
    logger.warn("ROOT_PASSWORD must be at least 8 characters; skipping root seed");
    return;
  }

  const created = await userService.ensureInitialRoot(env.ROOT_USERNAME, env.ROOT_PASSWORD);
  logger.info(created ? `Root account "${created.username}" created` : "Root account already exists; skip seed");
};
