import { Application } from "express";
import { notFoundHandler } from "~/middlewares/errors.middleware";
import { apiRouter } from "./api.routes";

export const routes = (app: Application) => {
  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok" }, message: "Service is healthy" });
  });
  app.use("/api", apiRouter);
  app.use("/api", notFoundHandler);
};
