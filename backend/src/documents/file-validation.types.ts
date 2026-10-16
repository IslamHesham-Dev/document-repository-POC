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

export type ValidatedUpload = {
  content: Buffer;
  fileSize: number;
  mimeType: AllowedMimeType;
  originalFilename: string;
  title: string;
};
