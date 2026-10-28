import type { CurrentUser } from "../users/user-context.types.js";

// Optional fields support PATCH semantics: omitted means unchanged, while a
// supplied empty array intentionally clears that relationship.
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
