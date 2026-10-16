import { LocalFileStorage } from "./local-file-storage.service.js";
import type { StorageService } from "./storage.service.js";

export const storageService: StorageService = new LocalFileStorage();

export type {
  SaveFileInput,
  StorageService,
  StoredFile,
} from "./storage.service.js";
