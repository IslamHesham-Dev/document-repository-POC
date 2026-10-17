import type {
  ApiErrorResponse,
  CreatedDocumentResponse,
  DocumentDetailsResponse,
  DocumentSearchResponse,
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

async function apiRequest<T>(
  path: string,
  userId: string,
  init: RequestInit = {},
): Promise<T> {
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

export function createDocument(input: {
  userId: string;
  title: string;
  file: File;
  tags: string[];
  permittedDepartmentIds: string[];
}) {
  const form = new FormData();
  form.append("file", input.file);
  form.append("title", input.title);
  form.append("tags", JSON.stringify(input.tags));
  form.append(
    "permittedDepartmentIds",
    JSON.stringify(input.permittedDepartmentIds),
  );

  return apiRequest<CreatedDocumentResponse>("/documents", input.userId, {
    method: "POST",
    body: form,
  });
}
