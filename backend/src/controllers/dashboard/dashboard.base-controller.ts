import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";
import { UserRole } from "~/utils/enum";
import { logger } from "~/utils/logger";

type DTOConfig = {
  body?: new () => any;
  query?: new () => any;
  params?: new () => any;
};

export abstract class BaseController {
  protected userRole: string;
  protected defaultLayout: string;

  constructor(userRole = "guest", layout = "./layouts/cms-layout.ejs") {
    this.userRole = userRole;
    this.defaultLayout = layout;
  }


  protected handleApiResponse(
    res: Response,
    payload: any,
    statusCode: number = 200,
    errorCode?: string
  ) {
    const success = statusCode >= 200 && statusCode < 300;

    return res.status(statusCode).json({
      success,
      errorCode: errorCode || null,
      ...payload,
    });
  }
}
