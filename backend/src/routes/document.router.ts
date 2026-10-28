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
  // Multer only parses the multipart request. Content validation and permanent
  // storage happen later in the document/version service.
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSize,
    files: 1,
    fields: 20,
    parts: 21,
  },
});

export const documentRouter = Router();

// Request map: router -> controller -> service -> repository/storage.
// Start here when tracing any document workflow from its HTTP endpoint.
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
