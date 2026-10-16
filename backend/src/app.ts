import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { getHealth } from "./health/health.controller.js";

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
