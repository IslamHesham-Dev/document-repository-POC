import type { NextFunction, Request, Response } from "express";

import { PocContextService } from "./poc-context.service.js";
import type { PocContextResponse } from "./poc-context.types.js";

const service = new PocContextService();

export async function getPocContext(
  _request: Request,
  response: Response<PocContextResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    response.status(200).json(await service.getContext());
  } catch (error: unknown) {
    next(error);
  }
}
