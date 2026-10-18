import type { CurrentUser } from "../../users/types/user-context.types.js";

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
