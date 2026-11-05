import { Request, Response } from "express";
import { validatedQuery } from "~/middlewares/zodValidator";
import { authService } from "~/services/auth.service";
import { userService } from "~/services/user.service";
import { asyncHandler, currentUser, sendCreated, sendData } from "~/utils/http";
import { PageQuery } from "~/utils/pagination";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    sendData(res, await authService.login(username, password), "Signed in successfully");
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, currentUser(req));
  }),
};

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    sendData(res, await userService.list(validatedQuery<PageQuery>(res)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await userService.create(req.body), "User created successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = currentUser(req);
    sendData(
      res,
      await userService.update(req.params.userId, req.body, user.userId),
      "User updated successfully",
    );
  }),
};
