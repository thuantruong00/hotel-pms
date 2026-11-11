import { Request, Response } from "express";
import { validatedQuery } from "~/middlewares/zodValidator";
import { workSessionService } from "~/services/work-session.service";
import { asyncHandler, currentUser, sendCreated, sendData } from "~/utils/http";
import { PageQuery } from "~/utils/pagination";

export const workSessionController = {
  open: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await workSessionService.open(currentUser(req)), "Work session opened");
  }),

  current: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await workSessionService.current(currentUser(req)));
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await workSessionService.close(req.params.sessionId, currentUser(req)),
      "Work session closed",
    );
  }),

  listRoomStays: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await workSessionService.listRoomStays(
        req.params.sessionId,
        currentUser(req),
        validatedQuery<PageQuery>(res),
      ),
    );
  }),
};
