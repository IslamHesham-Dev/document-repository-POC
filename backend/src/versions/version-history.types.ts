import type { CurrentUser } from "../users/user-context.types.js";

export type GetVersionHistoryInput = {
  currentUser: CurrentUser;
  documentId: string;
};

export type VersionHistoryResponse = {
  documentId: string;
  versions: Array<{
    id: string;
    versionNumber: number;
    uploader: {
      id: string;
      name: string;
      email: string;
    };
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
    isCurrent: boolean;
  }>;
};
