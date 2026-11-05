import { Request, Response } from "express";
import { validatedQuery } from "~/middlewares/zodValidator";
import { RoomListFilter } from "~/repositories/room.repository";
import { roomRateService } from "~/services/room-rate.service";
import { roomTypeService } from "~/services/room-type.service";
import { AvailabilityQuery, roomService } from "~/services/room.service";
import { asyncHandler, sendCreated, sendData } from "~/utils/http";

type ActiveFilter = { isActive?: boolean };

export const roomTypeController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    sendData(res, await roomTypeService.list(validatedQuery<ActiveFilter>(res)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await roomTypeService.create(req.body), "Room type created successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await roomTypeService.update(req.params.roomTypeId, req.body),
      "Room type updated successfully",
    );
  }),
};

export const roomRateController = {
  listByRoomType: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await roomRateService.listByRoomType(req.params.roomTypeId, validatedQuery<ActiveFilter>(res)),
    );
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(
      res,
      await roomRateService.create(req.params.roomTypeId, req.body),
      "Room rate created successfully",
    );
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await roomRateService.getById(req.params.rateId));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await roomRateService.update(req.params.rateId, req.body),
      "Room rate updated successfully",
    );
  }),
};

export const roomController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    sendData(res, await roomService.list(validatedQuery<RoomListFilter>(res)));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await roomService.getById(req.params.roomId));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await roomService.create(req.body), "Room created successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await roomService.update(req.params.roomId, req.body), "Room updated successfully");
  }),

  availability: asyncHandler(async (_req: Request, res: Response) => {
    sendData(res, await roomService.availability(validatedQuery<AvailabilityQuery>(res)));
  }),
};
