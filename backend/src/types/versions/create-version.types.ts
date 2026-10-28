import type { CurrentUser } from "../users/user-context.types.js";

// Contracts passed from the version controller into its orchestration service
// and returned after the immutable version is committed.
export type CreateVersionInput = {
  content: Buffer;
  documentId: string;
  originalFilename: string;
  uploader: CurrentUser;
};

export type CreatedVersionResponse = {
  version: {
    id: string;
    documentId: string;
    versionNumber: number;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    uploaderId: string;
    uploadedAt: string;
  };
};
