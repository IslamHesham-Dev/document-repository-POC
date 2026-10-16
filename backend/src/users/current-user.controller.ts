import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import type { CurrentUserResponse } from "./current-user.response.js";

export function getCurrentUser(
  request: Request,
  response: Response<CurrentUserResponse>,
  next: NextFunction,
): void {
  if (!request.currentUser) {
    next(
      new AppError(
        500,
        "USER_CONTEXT_MISSING",
        "The current user context is unavailable",
      ),
    );
    return;
  }

  response.status(200).json({
    user: request.currentUser,
  });
}
