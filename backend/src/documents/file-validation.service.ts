import { fileTypeFromBuffer } from "file-type";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import {
  ALLOWED_FILE_TYPES,
  type AllowedMimeType,
  type RawUploadMetadata,
  type ValidatedUpload,
} from "./file-validation.types.js";

const allowedMimeTypes = new Set<string>(
  ALLOWED_FILE_TYPES.map(({ mimeType }) => mimeType),
);

function validateTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw new AppError(
      400,
      "INVALID_DOCUMENT_TITLE",
      "Document title must be a string",
    );
  }

  const title = value.trim().replace(/\s+/g, " ");

  if (title.length === 0 || title.length > 255) {
    throw new AppError(
      400,
      "INVALID_DOCUMENT_TITLE",
      "Document title must contain between 1 and 255 characters",
    );
  }

  return title;
}

function validateOriginalFilename(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value) ||
    Buffer.byteLength(value, "utf8") > 255
  ) {
    throw new AppError(
      400,
      "INVALID_FILENAME",
      "The original filename is not valid",
    );
  }

  return value;
}

function isUtf8PlainText(content: Buffer): boolean {
  if (content.includes(0)) {
    return false;
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(content);
    return true;
  } catch {
    return false;
  }
}

async function detectMimeType(content: Buffer): Promise<AllowedMimeType> {
  let detectedType: Awaited<ReturnType<typeof fileTypeFromBuffer>>;

  try {
    detectedType = await fileTypeFromBuffer(content);
  } catch {
    detectedType = undefined;
  }

  if (detectedType && allowedMimeTypes.has(detectedType.mime)) {
    return detectedType.mime as AllowedMimeType;
  }

  if (!detectedType && isUtf8PlainText(content)) {
    return "text/plain";
  }

  throw new AppError(
    400,
    "UNSUPPORTED_FILE_TYPE",
    "Allowed file types are PDF, DOCX, and UTF-8 plain text",
  );
}

export class FileValidationService {
  public async validate(
    content: Buffer,
    metadata: RawUploadMetadata,
  ): Promise<ValidatedUpload> {
    if (content.length === 0) {
      throw new AppError(400, "EMPTY_FILE", "Uploaded files cannot be empty");
    }

    if (content.length > env.maxFileSize) {
      throw new AppError(
        413,
        "FILE_TOO_LARGE",
        `Uploaded files cannot exceed ${env.maxFileSize} bytes`,
      );
    }

    const title = validateTitle(metadata.title);
    const originalFilename = validateOriginalFilename(
      metadata.originalFilename,
    );
    const mimeType = await detectMimeType(content);

    return {
      content,
      fileSize: content.length,
      mimeType,
      originalFilename,
      title,
    };
  }
}
