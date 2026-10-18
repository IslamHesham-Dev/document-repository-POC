import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { documentRouter } from "./routes/document.router.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./errors/error.middleware.js";
import { getHealth } from "./controllers/health/health.controller.js";
import { loadCurrentUser } from "./middleware/user-context.middleware.js";
import { getCurrentUser } from "./controllers/users/current-user.controller.js";
import { getPocContext } from "./controllers/users/poc-context.controller.js";

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
