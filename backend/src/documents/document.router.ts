import { Router } from "express";
import multer from "multer";

import { env } from "../config/env.js";
import { createDocument } from "./create-document.controller.js";
import { createDocumentVersion } from "../versions/create-version.controller.js";

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

documentRouter.post("/", upload.single("file"), createDocument);
documentRouter.post(
  "/:documentId/versions",
  upload.single("file"),
  createDocumentVersion,
);
