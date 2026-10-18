import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../errors/app-error.js";
import { normalizeTagName } from "../../tags/validation/tag.normalizer.js";
import {
  DOCUMENT_SORT_FIELDS,
  type DocumentSearchInput,
  type DocumentSearchResponse,
  type DocumentSortField,
  type SortOrder,
} from "../types/document-search.types.js";
import { DocumentSearchService } from "../services/document-search.service.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const searchService = new DocumentSearchService();

function optionalSingleString(
  value: unknown,
  fieldName: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(
      400,
      "INVALID_SEARCH_QUERY",
      `${fieldName} must be provided once as text`,
    );
  }

  return value;
}

function positiveInteger(
  value: unknown,
  fieldName: string,
  fallback: number,
  maximum?: number,
): number {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AppError(
      400,
      "INVALID_PAGINATION",
      `${fieldName} must be a positive integer`,
    );
  }

  const parsed = Number(value);

  if (parsed < 1 || !Number.isSafeInteger(parsed) || (maximum && parsed > maximum)) {
    throw new AppError(
      400,
      "INVALID_PAGINATION",
      maximum
        ? `${fieldName} must be between 1 and ${maximum}`
        : `${fieldName} must be a positive integer`,
    );
  }

  return parsed;
}

function parseTags(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  if (!values.every((tag) => typeof tag === "string")) {
    throw new AppError(
      400,
      "INVALID_SEARCH_QUERY",
      "tag must contain only text values",
    );
  }

  return [
    ...new Set(
      values
        .flatMap((tag) => tag.split(","))
        .map((tag) => normalizeTagName(tag)),
    ),
  ];
}

function parseSearchInput(request: Request): Omit<DocumentSearchInput, "currentUser"> {
  const rawTitle = optionalSingleString(request.query.title, "title");
  const title = rawTitle?.trim().replace(/\s+/g, " ");

  if (title !== undefined && (title.length === 0 || title.length > 255)) {
    throw new AppError(
      400,
      "INVALID_SEARCH_QUERY",
      "title must contain between 1 and 255 characters",
    );
  }

  const uploaderId = optionalSingleString(
    request.query.uploaderId,
    "uploaderId",
  );

  if (uploaderId !== undefined && !uuidPattern.test(uploaderId)) {
    throw new AppError(
      400,
      "INVALID_UPLOADER_ID",
      "uploaderId must be a valid UUID",
    );
  }

  const rawSortBy = optionalSingleString(request.query.sortBy, "sortBy");
  const sortBy = rawSortBy ?? "createdAt";

  if (!DOCUMENT_SORT_FIELDS.some((field) => field === sortBy)) {
    throw new AppError(
      400,
      "INVALID_SORT",
      `sortBy must be one of: ${DOCUMENT_SORT_FIELDS.join(", ")}`,
    );
  }

  const rawSortOrder = optionalSingleString(
    request.query.sortOrder,
    "sortOrder",
  );
  const sortOrder = rawSortOrder ?? "desc";

  if (sortOrder !== "asc" && sortOrder !== "desc") {
    throw new AppError(
      400,
      "INVALID_SORT",
      "sortOrder must be asc or desc",
    );
  }

  return {
    title,
    tags: parseTags(request.query.tag),
    uploaderId,
    page: positiveInteger(request.query.page, "page", 1),
    pageSize: positiveInteger(request.query.pageSize, "pageSize", 20, 100),
    sortBy: sortBy as DocumentSortField,
    sortOrder: sortOrder as SortOrder,
  };
}

export async function searchDocuments(
  request: Request,
  response: Response<DocumentSearchResponse>,
  next: NextFunction,
): Promise<void> {
  if (!request.currentUser) {
    next(
      new AppError(
        401,
        "USER_CONTEXT_REQUIRED",
        "A current user is required to search documents",
      ),
    );
    return;
  }

  try {
    const result = await searchService.search({
      currentUser: request.currentUser,
      ...parseSearchInput(request),
    });

    response.status(200).json(result);
  } catch (error: unknown) {
    next(error);
  }
}
