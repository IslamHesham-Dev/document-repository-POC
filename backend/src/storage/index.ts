import { LocalFileStorage } from "./services/local-file-storage.service.js";
import type { StorageService } from "./types/storage.service.js";

export const storageService: StorageService = new LocalFileStorage();

export type {
  SaveFileInput,
  StorageService,
  StoredFile,
} from "./types/storage.service.js";
