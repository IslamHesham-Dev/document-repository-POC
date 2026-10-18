import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { MulterError } from "multer";

import { env } from "../config/env.js";
import { AppError } from "./app-error.js";
import type { ApiErrorResponse } from "../types/errors/api-error.types.js";

type BodyParserError = SyntaxError & {
  type?: string;
};

function sendError(
  response: Response<ApiErrorResponse>,
  statusCode: number,
  code: string,
  message: string,
): void {
  response.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}

function isInvalidJsonError(error: unknown): error is BodyParserError {
  return (
    error instanceof SyntaxError &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}

export function notFoundHandler(
  _request: Request,
  response: Response<ApiErrorResponse>,
): void {
  sendError(
    response,
    404,
    "ROUTE_NOT_FOUND",
    "The requested route was not found",
  );
}

export const globalErrorHandler: ErrorRequestHandler = (
  error: unknown,
  _request: Request,
  response: Response<ApiErrorResponse>,
  next: NextFunction,
): void => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (isInvalidJsonError(error)) {
    sendError(response, 400, "INVALID_JSON", "The request body is not valid JSON");
    return;
  }

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      sendError(
        response,
        413,
        "FILE_TOO_LARGE",
        `Uploaded files cannot exceed ${env.maxFileSize} bytes`,
      );
      return;
    }

    sendError(
      response,
      400,
      "INVALID_MULTIPART_FORM",
      "The multipart form data is not valid",
    );
    return;
  }

  if (error instanceof AppError) {
    sendError(response, error.statusCode, error.code, error.message);
    return;
  }

  if (env.nodeEnv !== "test") {
    console.error("Unexpected request error", error);
  }

  sendError(
    response,
    500,
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred",
  );
};
