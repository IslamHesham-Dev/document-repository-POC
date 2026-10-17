import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import { VersionHistoryService } from "./version-history.service.js";
import type { VersionHistoryResponse } from "./version-history.types.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const versionHistoryService = new VersionHistoryService();

export async function getVersionHistory(
  request: Request<{ documentId: string }>,
  response: Response<VersionHistoryResponse>,
  next: NextFunction,
): Promise<void> {
  if (!request.currentUser) {
    next(
      new AppError(
        401,
        "USER_CONTEXT_REQUIRED",
        "A current user is required to view version history",
      ),
    );
    return;
  }

  if (!uuidPattern.test(request.params.documentId)) {
    next(
      new AppError(
        400,
        "INVALID_DOCUMENT_ID",
        "Document ID must be a valid UUID",
      ),
    );
    return;
  }

  try {
    const result = await versionHistoryService.getHistory({
      documentId: request.params.documentId,
      currentUser: request.currentUser,
    });

    response.status(200).json(result);
  } catch (error: unknown) {
    next(error);
  }
}
