import type { CurrentUser } from "../users/user-context.types.js";

export const DOCUMENT_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "title",
] as const;

export type DocumentSortField = (typeof DOCUMENT_SORT_FIELDS)[number];
export type SortOrder = "asc" | "desc";

export type DocumentSearchInput = {
  currentUser: CurrentUser;
  page: number;
  pageSize: number;
  sortBy: DocumentSortField;
  sortOrder: SortOrder;
  tags: string[];
  title?: string;
  uploaderId?: string;
};

export type DocumentSearchResponse = {
  documents: Array<{
    id: string;
    title: string;
    accessScope: "RESTRICTED" | "ALL_DEPARTMENTS";
    uploader: {
      id: string;
      name: string;
      email: string;
    };
    tags: string[];
    currentVersion: {
      id: string;
      versionNumber: number;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
      uploadedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  sorting: {
    sortBy: DocumentSortField;
    sortOrder: SortOrder;
  };
};
