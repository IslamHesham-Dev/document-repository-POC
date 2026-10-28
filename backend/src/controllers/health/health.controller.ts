import type { Request, Response } from "express";

import type { HealthResponse } from "../../types/health/health.types.js";

// Public liveness endpoint: it proves the HTTP process responds, while the
// separate database check script verifies PostgreSQL connectivity.
export function getHealth(
  _request: Request,
  response: Response<HealthResponse>,
): void {
  response.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
