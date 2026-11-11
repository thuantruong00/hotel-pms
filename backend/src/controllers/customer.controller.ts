import { Request, Response } from "express";
import { validatedQuery } from "~/middlewares/zodValidator";
import { CustomerListFilter } from "~/repositories/customer.repository";
import { customerService } from "~/services/customer.service";
import { asyncHandler, sendCreated, sendData } from "~/utils/http";

export const customerController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await customerService.create(req.body), "Customer created successfully");
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    sendData(res, await customerService.list(validatedQuery<CustomerListFilter>(res)));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    sendData(res, await customerService.getById(req.params.customerId));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    sendData(
      res,
      await customerService.update(req.params.customerId, req.body),
      "Customer updated successfully",
    );
  }),

  addIdentity: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(
      res,
      await customerService.addIdentity(req.params.customerId, req.body),
      "Identity added successfully",
    );
  }),
};
