import { AppError } from "../../errors/app-error.js";

export function validateDocumentTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw new AppError(
      400,
      "INVALID_DOCUMENT_TITLE",
      "Document title must be a string",
    );
  }

  // Canonical whitespace avoids visually different duplicates and stores a
  // clean value regardless of frontend formatting.
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
