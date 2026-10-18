import { Router } from "express";
import multer from "multer";

import { env } from "../config/env.js";
import { createDocument } from "./controllers/create-document.controller.js";
import { createDocumentVersion } from "../versions/controllers/create-version.controller.js";
import { searchDocuments } from "../search/controllers/document-search.controller.js";
import { getVersionHistory } from "../versions/controllers/version-history.controller.js";
import { getDocumentDetails } from "./controllers/document-details.controller.js";
import { downloadDocumentVersion } from "../versions/controllers/version-download.controller.js";
import { updateDocumentMetadata } from "./controllers/update-document-metadata.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSize,
    files: 1,
    fields: 20,
    parts: 21,
  },
});

export const documentRouter = Router();

documentRouter.get("/", searchDocuments);
documentRouter.get(
  "/:documentId/versions/:versionId/download",
  downloadDocumentVersion,
);
documentRouter.get("/:documentId/versions", getVersionHistory);
documentRouter.get("/:documentId", getDocumentDetails);
documentRouter.patch("/:documentId", updateDocumentMetadata);
documentRouter.post("/", upload.single("file"), createDocument);
documentRouter.post(
  "/:documentId/versions",
  upload.single("file"),
  createDocumentVersion,
);
