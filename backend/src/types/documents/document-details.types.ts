import type { CurrentUser } from "../users/user-context.types.js";

// Permission-aware service input and the safe public document-details shape.
export type GetDocumentDetailsInput = {
  currentUser: CurrentUser;
  documentId: string;
};

export type DocumentDetailsResponse = {
  document: {
    id: string;
    title: string;
    accessScope: "RESTRICTED" | "ALL_DEPARTMENTS";
    uploader: {
      id: string;
      name: string;
      email: string;
    };
    tags: string[];
    permittedDepartments: Array<{
      id: string;
      name: string;
    }>;
    currentVersion: {
      id: string;
      versionNumber: number;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
      uploaderId: string;
      uploadedAt: string;
    };
    createdAt: string;
    updatedAt: string;
    download: {
      href: string;
      filename: string;
      mimeType: string;
      fileSize: number;
      versionId: string;
    };
  };
};
