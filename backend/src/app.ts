import "reflect-metadata";
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import { routes } from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errors.middleware";
import { env } from "./utils/env";

const app: express.Application = express();

app.disable("x-powered-by");
app.use(morgan("dev"));

if (env.CORS_ORIGIN) {
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
}

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

routes(app);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
