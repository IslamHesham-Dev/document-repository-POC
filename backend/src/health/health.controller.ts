import type { Request, Response } from "express";

import type { HealthResponse } from "./health.types.js";

export function getHealth(
  _request: Request,
  response: Response<HealthResponse>,
): void {
  response.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
