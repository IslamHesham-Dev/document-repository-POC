import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import { PermissionService } from "../permissions/permission.service.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const permissionService = new PermissionService();

export async function requireDocumentAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  if (!request.currentUser) {
    next(
      new AppError(
        401,
        "USER_CONTEXT_REQUIRED",
        "A current user is required to access this resource",
      ),
    );
    return;
  }

  const rawDocumentId = request.params.documentId;
  const documentId = Array.isArray(rawDocumentId)
    ? rawDocumentId[0]
    : rawDocumentId;

  if (!documentId || !uuidPattern.test(documentId)) {
    next(
      new AppError(
        400,
        "INVALID_DOCUMENT_ID",
        "The document ID must be a valid UUID",
      ),
    );
    return;
  }

  try {
    await permissionService.requireDocumentAccess(
      request.currentUser,
      documentId,
    );
    next();
  } catch (error: unknown) {
    next(error);
  }
}
