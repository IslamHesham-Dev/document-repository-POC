import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import type {
  CreateDocumentFields,
  CreatedDocumentResponse,
} from "./create-document.types.js";
import { DocumentService } from "./document.service.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const documentService = new DocumentService();

function parseStringList(value: unknown, fieldName: string): string[] {
  if (value === undefined || value === "") {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  if (!values.every((item) => typeof item === "string")) {
    throw new AppError(
      400,
      "INVALID_UPLOAD_METADATA",
      `${fieldName} must contain only strings`,
    );
  }

  if (values.length === 1 && values[0].trim().startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(values[0]);

      if (
        !Array.isArray(parsed) ||
        !parsed.every((item) => typeof item === "string")
      ) {
        throw new Error("Expected an array of strings.");
      }

      return parsed;
    } catch {
      throw new AppError(
        400,
        "INVALID_UPLOAD_METADATA",
        `${fieldName} must be a valid JSON array of strings`,
      );
    }
  }

  return values.flatMap((item) => item.split(",")).filter(Boolean);
}

function parseFields(body: Request["body"]): CreateDocumentFields {
  const tags = parseStringList(body?.tags, "tags");
  const permittedDepartmentIds = parseStringList(
    body?.permittedDepartmentIds,
    "permittedDepartmentIds",
  );

  if (!permittedDepartmentIds.every((id) => uuidPattern.test(id))) {
    throw new AppError(
      400,
      "INVALID_DEPARTMENT_ID",
      "Every permitted department ID must be a valid UUID",
    );
  }

  const rawAccessScope = body?.accessScope;
  const accessScope = rawAccessScope ?? "RESTRICTED";

  if (
    accessScope !== "RESTRICTED" &&
    accessScope !== "ALL_DEPARTMENTS"
  ) {
    throw new AppError(
      400,
      "INVALID_ACCESS_SCOPE",
      "Access scope must be RESTRICTED or ALL_DEPARTMENTS",
    );
  }

  if (accessScope === "ALL_DEPARTMENTS" && permittedDepartmentIds.length > 0) {
    throw new AppError(
      400,
      "CONFLICTING_PERMISSIONS",
      "ALL_DEPARTMENTS documents cannot include department permissions",
    );
  }

  return {
    title: body?.title,
    tags,
    permittedDepartmentIds: [...new Set(permittedDepartmentIds)],
    accessScope,
  };
}

export async function createDocument(
  request: Request,
  response: Response<CreatedDocumentResponse>,
  next: NextFunction,
): Promise<void> {
  if (!request.currentUser) {
    next(
      new AppError(
        401,
        "USER_CONTEXT_REQUIRED",
        "A current user is required to upload a document",
      ),
    );
    return;
  }

  if (!request.file) {
    next(new AppError(400, "FILE_REQUIRED", "A document file is required"));
    return;
  }

  try {
    const result = await documentService.create({
      content: request.file.buffer,
      originalFilename: request.file.originalname,
      uploader: request.currentUser,
      fields: parseFields(request.body),
    });

    response.status(201).json(result);
  } catch (error: unknown) {
    next(error);
  }
}
