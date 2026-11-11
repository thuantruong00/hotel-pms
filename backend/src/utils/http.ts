import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "~/errors";

/** Forwards rejected promises from async handlers to the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const sendData = (
  res: Response,
  data: unknown,
  message = "Operation completed successfully",
  status = 200,
) => res.status(status).json({ data, message });

export const sendCreated = (res: Response, data: unknown, message: string) =>
  sendData(res, data, message, 201);

/** Returns the authenticated user or throws 401. */
export const currentUser = (req: Request) => {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
};
