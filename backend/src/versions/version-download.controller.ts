import { pipeline } from "node:stream/promises";

import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import { VersionDownloadService } from "./version-download.service.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const versionDownloadService = new VersionDownloadService();

function contentDisposition(filename: string): string {
  const asciiFallback =
    filename
      .replace(/[^\x20-\x7e]/g, "_")
      .replace(/["\\]/g, "_") || "download";
  const encodedFilename = encodeURIComponent(filename).replace(
    /['()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`;
}

export async function downloadDocumentVersion(
  request: Request<{ documentId: string; versionId: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  if (!request.currentUser) {
    next(
      new AppError(
        401,
        "USER_CONTEXT_REQUIRED",
        "A current user is required to download a document version",
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

  if (!uuidPattern.test(request.params.versionId)) {
    next(
      new AppError(
        400,
        "INVALID_VERSION_ID",
        "Version ID must be a valid UUID",
      ),
    );
    return;
  }

  try {
    const download = await versionDownloadService.getDownload({
      documentId: request.params.documentId,
      versionId: request.params.versionId,
      currentUser: request.currentUser,
    });

    response.status(200);
    response.setHeader("Content-Type", download.mimeType);
    response.setHeader("Content-Length", download.fileSize.toString());
    response.setHeader(
      "Content-Disposition",
      contentDisposition(download.originalFilename),
    );
    response.setHeader("X-Content-Type-Options", "nosniff");

    await pipeline(download.stream, response);
  } catch (error: unknown) {
    if (response.headersSent) {
      response.destroy(error instanceof Error ? error : undefined);
      return;
    }

    next(error);
  }
}
