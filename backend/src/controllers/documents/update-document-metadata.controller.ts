import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../errors/app-error.js";
import type { DocumentDetailsResponse } from "../../types/documents/document-details.types.js";
import { UpdateDocumentMetadataService } from "../../services/documents/update-document-metadata.service.js";
import type { UpdateDocumentMetadataFields } from "../../types/documents/update-document-metadata.types.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedFields = new Set([
  "title",
  "tags",
  "permittedDepartmentIds",
  "accessScope",
]);
const updateService = new UpdateDocumentMetadataService();

function parseFields(body: unknown): UpdateDocumentMetadataFields {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(
      400,
      "INVALID_METADATA_UPDATE",
      "The request body must be a JSON object",
    );
  }

  const values = body as Record<string, unknown>;
  const keys = Object.keys(values);

  if (keys.length === 0 || !keys.some((key) => allowedFields.has(key))) {
    throw new AppError(
      400,
      "EMPTY_METADATA_UPDATE",
      "Provide at least one metadata field to update",
    );
  }

  const unknownField = keys.find((key) => !allowedFields.has(key));

  if (unknownField) {
    throw new AppError(
      400,
      "INVALID_METADATA_UPDATE",
      `Unknown metadata field: ${unknownField}`,
    );
  }

  if (
    values.tags !== undefined &&
    (!Array.isArray(values.tags) ||
      !values.tags.every((tag) => typeof tag === "string"))
  ) {
    throw new AppError(
      400,
      "INVALID_METADATA_UPDATE",
      "tags must be an array of strings",
    );
  }

  if (
    values.permittedDepartmentIds !== undefined &&
    (!Array.isArray(values.permittedDepartmentIds) ||
      !values.permittedDepartmentIds.every(
        (id) => typeof id === "string" && uuidPattern.test(id),
      ))
  ) {
    throw new AppError(
      400,
      "INVALID_DEPARTMENT_ID",
      "permittedDepartmentIds must contain valid UUIDs",
    );
  }

  if (
    values.accessScope !== undefined &&
    values.accessScope !== "RESTRICTED" &&
    values.accessScope !== "ALL_DEPARTMENTS"
  ) {
    throw new AppError(
      400,
      "INVALID_ACCESS_SCOPE",
      "Access scope must be RESTRICTED or ALL_DEPARTMENTS",
    );
  }

  return {
    title: values.title,
    tags: values.tags as string[] | undefined,
    permittedDepartmentIds: values.permittedDepartmentIds as
      | string[]
      | undefined,
    accessScope: values.accessScope as
      | "RESTRICTED"
      | "ALL_DEPARTMENTS"
      | undefined,
  };
}

export async function updateDocumentMetadata(
  request: Request<{ documentId: string }>,
  response: Response<DocumentDetailsResponse>,
  next: NextFunction,
): Promise<void> {
  if (!request.currentUser) {
    next(
      new AppError(
        401,
        "USER_CONTEXT_REQUIRED",
        "A current user is required to update document metadata",
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
    // Next: services/documents/update-document-metadata.service.ts applies
    // modification permissions and business rules before repository access.
    const result = await updateService.update({
      documentId: request.params.documentId,
      currentUser: request.currentUser,
      fields: parseFields(request.body),
    });

    response.status(200).json(result);
  } catch (error: unknown) {
    next(error);
  }
}
