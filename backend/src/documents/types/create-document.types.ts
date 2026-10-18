import type { CurrentUser } from "../../users/types/user-context.types.js";

export type CreateDocumentFields = {
  accessScope: "RESTRICTED" | "ALL_DEPARTMENTS";
  permittedDepartmentIds: string[];
  tags: string[];
  title: unknown;
};

export type CreateDocumentInput = {
  content: Buffer;
  fields: CreateDocumentFields;
  originalFilename: string;
  uploader: CurrentUser;
};

export type CreatedDocumentResponse = {
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
      uploadedAt: string;
    };
    createdAt: string;
    updatedAt: string;
  };
};
