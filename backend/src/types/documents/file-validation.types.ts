// Single backend allowlist used by byte-level file validation. The browser's
// declared type is not trusted.
export const ALLOWED_FILE_TYPES = [
  {
    extension: "pdf",
    mimeType: "application/pdf",
  },
  {
    extension: "docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    extension: "txt",
    mimeType: "text/plain",
  },
] as const;

export type AllowedMimeType = (typeof ALLOWED_FILE_TYPES)[number]["mimeType"];

export type RawUploadMetadata = {
  originalFilename: unknown;
  title: unknown;
};

export type ValidatedFile = {
  content: Buffer;
  fileSize: number;
  mimeType: AllowedMimeType;
  originalFilename: string;
};

export type ValidatedUpload = ValidatedFile & {
  title: string;
};
