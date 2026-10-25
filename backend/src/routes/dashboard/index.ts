import { query, Router } from "express";
import { mkdirSync } from "fs";
import multer from "multer";
import path from "path";
import is from "zod/v4/locales/is.cjs";

import {
  AccountController,
  AppSettingController,
  AuthController,
} from "~/controllers";
import { ActionCreateAccountBodySchema } from "~/controllers/dashboard/account/account.dto";
import { ActionSignInBodySchema } from "~/controllers/dashboard/auth/auth.dto";

import { Middleware, zodMultiValidator } from "~/middlewares";
import { AllRoles, IsUserGroup } from "~/utils/const";
import { env } from "~/utils";
import { UserRole } from "~/utils/enum";

export const dashboardRouter = Router();

const firmwareStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const firmwaresDir = path.resolve(env.FIRMWARES_DIR);
    mkdirSync(firmwaresDir, { recursive: true });
    cb(null, firmwaresDir);
  },
  filename: (_req, file, cb) => {
    const filename = path.basename(file.originalname);
    const safePattern = /^[a-zA-Z0-9._-]+\.bin$/;

    if (!safePattern.test(filename)) {
      cb(new Error("Invalid firmware filename"), filename);
      return;
    }

    cb(null, filename);
  },
});

const firmwareUpload = multer({
  storage: firmwareStorage,
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".bin")) {
      cb(new Error("Only .bin files are allowed"));
      return;
    }

    cb(null, true);
  },
});

// ─── Device Control ────────────────────────────────────────────────
const middleware = new Middleware();
const authController = new AuthController();
const accountController = new AccountController();
const appSettingController = new AppSettingController();



// ─── Account ───────────────────────────────────────────────────────
// dashboardRouter.get(
//   "/account",
//   middleware.webPageMiddleware("account"),
//   accountController.handleAccountPage.bind(accountController),
// );
// dashboardRouter.get(
//   "/account/create",
//   middleware.webPageMiddleware("accountAdd"),
//   accountController.handleAccountCreatePage.bind(accountController),
// );
// dashboardRouter.post(
//   "/account/create",
//   zodMultiValidator({ body: ActionCreateAccountBodySchema }),
//   middleware.webPageMiddleware("accountAdd"),
//   accountController.handleAccountCreateFormPage.bind(accountController),
// );

// dashboardRouter.get(
//   "/account/delete/:userId",
//   middleware.webPageMiddleware("accountAdd"),
//   accountController.handleAccountDeleteFormPage.bind(accountController),
// );

// ─── Auth ───────────────────────────────────────────────────────
// dashboardRouter.get("/auth/sign-in", authController.handleSignInPage);
// dashboardRouter.post(
//   "/auth/sign-in",
//   zodMultiValidator({ body: ActionSignInBodySchema }),
//   authController.handleSignInFormPage,
// );
// dashboardRouter.get("/auth/sign-out", authController.handleSignOutPage);

