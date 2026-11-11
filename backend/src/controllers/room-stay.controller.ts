import { Request, Response } from "express";
import { validatedQuery } from "~/middlewares/zodValidator";
import { RoomStayListFilter } from "~/repositories/room-stay.repository";
import { billingService } from "~/services/billing.service";
import { roomStayService } from "~/services/room-stay.service";
import { asyncHandler, currentUser, sendCreated, sendData } from "~/utils/http";

export const roomStayController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(
      res,
      await roomStayService.create(req.body, currentUser(req)),
      "Room stay created successfully",
    );
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    sendData(res, await roomStayService.list(validatedQuery<RoomStayListFilter>(res)));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await roomStayService.getById(req.params.stayId));
  }),

  checkIn: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await roomStayService.checkIn(req.params.stayId), "Checked in successfully");
  }),

  checkOut: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await roomStayService.checkOut(req.params.stayId), "Checked out successfully");
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await roomStayService.cancel(req.params.stayId, req.body),
      "Room stay cancelled successfully",
    );
  }),

  noShow: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await roomStayService.noShow(req.params.stayId, req.body),
      "Room stay marked as no-show",
    );
  }),

  addCustomers: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await roomStayService.addCustomers(req.params.stayId, req.body.customers),
      "Customers added successfully",
    );
  }),
};

export const billingController = {
  getBill: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await billingService.getBill(req.params.stayId));
  }),

  finalize: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await billingService.finalize(req.params.stayId, req.body, currentUser(req)),
      "Bill finalized successfully",
    );
  }),

  markPaid: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await billingService.markPaid(req.params.stayId, req.body, currentUser(req)),
      "Bill marked as paid",
    );
  }),
};
