import type { CurrentUser } from "../users/user-context.types.js";

export type UpdateDocumentMetadataFields = {
  accessScope?: "RESTRICTED" | "ALL_DEPARTMENTS";
  permittedDepartmentIds?: string[];
  tags?: string[];
  title?: unknown;
};

export type UpdateDocumentMetadataInput = {
  currentUser: CurrentUser;
  documentId: string;
  fields: UpdateDocumentMetadataFields;
};
