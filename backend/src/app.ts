import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./errors/error.middleware.js";
import { getHealth } from "./health/health.controller.js";
import { loadCurrentUser } from "./middleware/user-context.middleware.js";
import { getCurrentUser } from "./users/current-user.controller.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", getHealth);

app.use("/api", loadCurrentUser);
app.get("/api/me", getCurrentUser);

app.use(notFoundHandler);
app.use(globalErrorHandler);
