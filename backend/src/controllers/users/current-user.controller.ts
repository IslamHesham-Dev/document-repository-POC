import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../errors/app-error.js";
import type { CurrentUserResponse } from "../../types/users/current-user.response.js";

// user-context middleware already resolved the database user; this controller
// simply exposes that safe request context to the POC frontend.
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
