import { LocalFileStorage } from "./local-file-storage.service.js";
import type { StorageService } from "../../types/storage/storage.service.js";

// Higher layers depend on StorageService, not this implementation. Replacing
// local storage with S3/Azure Blob therefore does not change controllers.
export const storageService: StorageService = new LocalFileStorage();

export type {
  SaveFileInput,
  StorageService,
  StoredFile,
} from "../../types/storage/storage.service.js";
