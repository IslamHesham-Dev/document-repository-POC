import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../errors/app-error.js";
import type { CreatedVersionResponse } from "../../types/versions/create-version.types.js";
import { VersionService } from "../../services/versions/version.service.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const versionService = new VersionService();

export async function createDocumentVersion(
  request: Request<{ documentId: string }>,
  response: Response<CreatedVersionResponse>,
  next: NextFunction,
): Promise<void> {
  if (!request.currentUser) {
    next(
      new AppError(
        401,
        "USER_CONTEXT_REQUIRED",
        "A current user is required to upload a document version",
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

  if (!request.file) {
    next(new AppError(400, "FILE_REQUIRED", "A document file is required"));
    return;
  }

  try {
    // Next: services/versions/version.service.ts authorizes modification, stores
    // the replacement bytes, and advances the current-version pointer.
    const result = await versionService.create({
      documentId: request.params.documentId,
      content: request.file.buffer,
      originalFilename: request.file.originalname,
      uploader: request.currentUser,
    });

    response.status(201).json(result);
  } catch (error: unknown) {
    next(error);
  }
}
