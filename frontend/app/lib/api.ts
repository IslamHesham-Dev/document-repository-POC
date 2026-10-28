import type {
  ApiErrorResponse,
  CreatedDocumentResponse,
  CreatedVersionResponse,
  DocumentDetailsResponse,
  DocumentSearchResponse,
  PocContextResponse,
  VersionHistoryResponse,
} from "@/app/types/api";
import { apiBaseUrl } from "./config";

export class ApiClientError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function getPocContext(): Promise<PocContextResponse> {
  const response = await fetch(`${apiBaseUrl}/poc-context`);

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      "POC_CONTEXT_FAILED",
      "The development users could not be loaded",
    );
  }

  return (await response.json()) as PocContextResponse;
}

async function apiRequest<T>(
  path: string,
  userId: string,
  init: RequestInit = {},
): Promise<T> {
  // This is the shared frontend -> backend boundary for JSON requests. The
  // backend user-context middleware validates this development-only identity.
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "X-User-Id": userId,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json()) as ApiErrorResponse;
    throw new ApiClientError(
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? "The API request failed",
    );
  }

  return (await response.json()) as T;
}

export function searchDocuments(userId: string, query = new URLSearchParams()) {
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiRequest<DocumentSearchResponse>(`/documents${suffix}`, userId);
}

export function getDocument(userId: string, documentId: string) {
  return apiRequest<DocumentDetailsResponse>(`/documents/${documentId}`, userId);
}

export function getVersionHistory(userId: string, documentId: string) {
  return apiRequest<VersionHistoryResponse>(
    `/documents/${documentId}/versions`,
    userId,
  );
}

export async function downloadDocumentVersion(
  userId: string,
  documentId: string,
  versionId: string,
  fallbackFilename: string,
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(
    `${apiBaseUrl}/documents/${documentId}/versions/${versionId}/download`,
    {
      headers: {
        "X-User-Id": userId,
      },
    },
  );

  if (!response.ok) {
    let body: ApiErrorResponse | null = null;

    try {
      body = (await response.json()) as ApiErrorResponse;
    } catch {
      // A non-JSON server response still becomes the same predictable client error.
    }

    throw new ApiClientError(
      response.status,
      body?.error?.code ?? "DOWNLOAD_FAILED",
      body?.error?.message ?? "The file could not be downloaded",
    );
  }

  const disposition = response.headers.get("Content-Disposition");
  const encodedFilename = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const quotedFilename = disposition?.match(/filename="([^"]+)"/i)?.[1];
  const filename = encodedFilename
    ? decodeURIComponent(encodedFilename)
    : quotedFilename ?? fallbackFilename;

  return { blob: await response.blob(), filename };
}

export function createDocument(
  input: {
    userId: string;
    title: string;
    file: File;
    tags: string[];
    permittedDepartmentIds: string[];
  },
  onProgress?: (percentage: number) => void,
): Promise<CreatedDocumentResponse> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("title", input.title);
  form.append("tags", JSON.stringify(input.tags));
  form.append(
    "permittedDepartmentIds",
    JSON.stringify(input.permittedDepartmentIds),
  );

  // XMLHttpRequest is used only for uploads because it exposes progress events;
  // the request then enters backend routes/document.router.ts.
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${apiBaseUrl}/documents`);
    request.setRequestHeader("X-User-Id", input.userId);
    request.responseType = "json";
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      const body = request.response as
        | CreatedDocumentResponse
        | ApiErrorResponse
        | null;

      if (request.status >= 200 && request.status < 300 && body) {
        onProgress?.(100);
        resolve(body as CreatedDocumentResponse);
        return;
      }

      const errorBody = body as ApiErrorResponse | null;
      reject(
        new ApiClientError(
          request.status,
          errorBody?.error?.code ?? "UPLOAD_FAILED",
          errorBody?.error?.message ?? "The upload request failed",
        ),
      );
    });
    request.addEventListener("error", () => {
      reject(
        new ApiClientError(
          0,
          "NETWORK_ERROR",
          "The backend could not be reached",
        ),
      );
    });
    request.send(form);
  });
}

export function createDocumentVersion(
  input: {
    userId: string;
    documentId: string;
    file: File;
  },
  onProgress?: (percentage: number) => void,
): Promise<CreatedVersionResponse> {
  const form = new FormData();
  form.append("file", input.file);

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `${apiBaseUrl}/documents/${input.documentId}/versions`,
    );
    request.setRequestHeader("X-User-Id", input.userId);
    request.responseType = "json";
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      const body = request.response as
        | CreatedVersionResponse
        | ApiErrorResponse
        | null;

      if (request.status >= 200 && request.status < 300 && body) {
        onProgress?.(100);
        resolve(body as CreatedVersionResponse);
        return;
      }

      const errorBody = body as ApiErrorResponse | null;
      reject(
        new ApiClientError(
          request.status,
          errorBody?.error?.code ?? "VERSION_UPLOAD_FAILED",
          errorBody?.error?.message ?? "The version upload failed",
        ),
      );
    });
    request.addEventListener("error", () => {
      reject(
        new ApiClientError(
          0,
          "NETWORK_ERROR",
          "The backend could not be reached",
        ),
      );
    });
    request.send(form);
  });
}
