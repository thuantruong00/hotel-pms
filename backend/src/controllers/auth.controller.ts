import { Request, Response } from "express";
import { validatedQuery } from "~/middlewares/zodValidator";
import { authService, withAccess } from "~/services/auth.service";
import { userService } from "~/services/user.service";
import { asyncHandler, currentUser, sendCreated, sendData } from "~/utils/http";
import { PageQuery } from "~/utils/pagination";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    sendData(res, await authService.login(username, password), "Signed in successfully");
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, withAccess(currentUser(req)));
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(currentUser(req), currentPassword, newPassword);
    sendData(res, null, "Password changed successfully");
  }),
};

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await userService.list(validatedQuery<PageQuery>(res), currentUser(req)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await userService.create(req.body, currentUser(req)), "User created successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = currentUser(req);
    sendData(
      res,
      await userService.update(req.params.userId, req.body, user),
      "User updated successfully",
    );
  }),
};
