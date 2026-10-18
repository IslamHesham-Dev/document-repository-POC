import type { Readable } from "node:stream";

import type { CurrentUser } from "../../users/types/user-context.types.js";

export type GetVersionDownloadInput = {
  currentUser: CurrentUser;
  documentId: string;
  versionId: string;
};

export type VersionDownload = {
  stream: Readable;
  originalFilename: string;
  mimeType: string;
  fileSize: bigint;
};
