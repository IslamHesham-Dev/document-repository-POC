import { Router } from "express";
import multer from "multer";

import { env } from "../config/env.js";
import { createDocument } from "../controllers/documents/create-document.controller.js";
import { createDocumentVersion } from "../controllers/versions/create-version.controller.js";
import { searchDocuments } from "../controllers/search/document-search.controller.js";
import { getVersionHistory } from "../controllers/versions/version-history.controller.js";
import { getDocumentDetails } from "../controllers/documents/document-details.controller.js";
import { downloadDocumentVersion } from "../controllers/versions/version-download.controller.js";
import { updateDocumentMetadata } from "../controllers/documents/update-document-metadata.controller.js";

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
