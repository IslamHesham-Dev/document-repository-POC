import type { Readable } from "node:stream";

import type { CurrentUser } from "../users/user-context.types.js";

// The service returns a stream and safe response metadata; the storage key and
// physical path never cross the controller/API boundary.
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
