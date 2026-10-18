import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { documentRouter } from "./documents/document.router.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./errors/error.middleware.js";
import { getHealth } from "./health/health.controller.js";
import { loadCurrentUser } from "./middleware/user-context.middleware.js";
import { getCurrentUser } from "./users/controllers/current-user.controller.js";
import { getPocContext } from "./users/controllers/poc-context.controller.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-User-Id"],
    exposedHeaders: ["Content-Disposition", "Content-Length"],
  }),
);
app.use(express.json());

app.get("/health", getHealth);
app.get("/api/poc-context", getPocContext);

app.use("/api", loadCurrentUser);
app.get("/api/me", getCurrentUser);
app.use("/api/documents", documentRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);
