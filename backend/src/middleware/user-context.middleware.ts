import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import { UserRepository } from "../repositories/users/user.repository.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const userRepository = new UserRepository();

export async function loadCurrentUser(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  const userId = request.header("x-user-id")?.trim();

  if (!userId) {
    next(
      new AppError(
        401,
        "USER_ID_REQUIRED",
        "The X-User-Id header is required",
      ),
    );
    return;
  }

  if (!uuidPattern.test(userId)) {
    next(
      new AppError(
        401,
        "INVALID_USER_ID",
        "The X-User-Id header must contain a valid UUID",
      ),
    );
    return;
  }

  try {
    const user = await userRepository.findCurrentUserById(userId);

    if (!user) {
      next(
        new AppError(
          401,
          "UNKNOWN_USER",
          "The user identified by X-User-Id does not exist",
        ),
      );
      return;
    }

    request.currentUser = user;
    // The selected controller can now rely on a verified currentUser. Document
    // permissions are still enforced later by the permission service.
    next();
  } catch (error: unknown) {
    next(error);
  }
}
