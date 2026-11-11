import { NextFunction, Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { isAppError } from "~/errors";
import { logger } from "~/utils/logger";

const send = (res: Response, status: number, code: string, message: string, details?: unknown) =>
  res.status(status).json({
    error: details === undefined ? { code, message } : { code, message, details },
  });

export const notFoundHandler = (_req: Request, res: Response) =>
  send(res, 404, "NOT_FOUND", "The requested endpoint does not exist");

/**
 * Converts errors to the standard API error response. Database errors are
 * never exposed directly to clients.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (isAppError(err)) {
    return send(res, err.status, err.code, err.message, err.details);
  }

  // Malformed JSON body from express.json()
  if (err?.type === "entity.parse.failed") {
    return send(res, 400, "MALFORMED_REQUEST", "The request body is not valid JSON");
  }

  if (err instanceof QueryFailedError) {
    const pgCode = (err as any).driverError?.code;
    // 23505 unique_violation, 23503 foreign_key_violation
    if (pgCode === "23505") {
      return send(res, 409, "DUPLICATE_RESOURCE", "The resource conflicts with an existing record");
    }
    if (pgCode === "23503") {
      return send(res, 409, "RESOURCE_IN_USE", "The resource is referenced by other records");
    }
    // 22P02 invalid_text_representation (e.g. malformed uuid)
    if (pgCode === "22P02") {
      return send(res, 400, "MALFORMED_REQUEST", "The request contains an invalid value");
    }
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err?.stack || err}`);
  return send(res, 500, "INTERNAL_ERROR", "An unexpected error occurred");
};
