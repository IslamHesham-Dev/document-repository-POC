export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export type DepartmentSummary = {
  id: string;
  name: string;
};

export type DevelopmentUser = UserSummary & {
  role: "EMPLOYEE" | "ADMIN";
  department: DepartmentSummary;
};

export type PocContextResponse = {
  identityMechanism: "POC_X_USER_ID";
  warning: string;
  users: DevelopmentUser[];
  departments: DepartmentSummary[];
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export type VersionSummary = {
  id: string;
  versionNumber: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
};

export type DocumentSummary = {
  id: string;
  title: string;
  accessScope: "RESTRICTED" | "ALL_DEPARTMENTS";
  uploader: UserSummary;
  tags: string[];
  currentVersion: VersionSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatedDocumentResponse = {
  document: DocumentSummary & {
    permittedDepartments: Array<{ id: string; name: string }>;
    currentVersion: VersionSummary & { storageKey: string };
  };
};

export type DocumentSearchResponse = {
  documents: DocumentSummary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  sorting: {
    sortBy: "createdAt" | "updatedAt" | "title";
    sortOrder: "asc" | "desc";
  };
};

export type DocumentDetailsResponse = {
  document: DocumentSummary & {
    permittedDepartments: Array<{ id: string; name: string }>;
    currentVersion: VersionSummary & { uploaderId: string };
    download: {
      href: string;
      filename: string;
      mimeType: string;
      fileSize: number;
      versionId: string;
    };
  };
};

export type VersionHistoryResponse = {
  documentId: string;
  versions: Array<
    VersionSummary & {
      uploader: UserSummary;
      isCurrent: boolean;
    }
  >;
};
