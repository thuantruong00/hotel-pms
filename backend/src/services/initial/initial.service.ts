import bcrypt from "bcrypt";
import { ZoneRepository } from "~/repositories";
import { UserRole, UserStatus } from "~/utils/enum";
import { env } from "~/utils";
import { logger } from "~/utils/logger";
import { initJobs } from "../cronjob";

export const initialService = async () => {
  if (Number(env.INIT)) {
    logger.debug(`Init service: ${Number(env.INIT)}`);

  } else {
    logger.debug(`Init service: skip`);
  }

  return;
};

