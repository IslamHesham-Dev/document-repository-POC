-- RenameColumn
ALTER TABLE "document_versions" RENAME COLUMN "created_at" TO "uploaded_at";

-- AlterTable
ALTER TABLE "document_versions"
ADD COLUMN "file_size" BIGINT NOT NULL,
ADD COLUMN "mime_type" TEXT NOT NULL,
ADD COLUMN "original_filename" TEXT NOT NULL,
ADD COLUMN "storage_key" TEXT NOT NULL,
ADD COLUMN "uploader_id" UUID NOT NULL,
ADD COLUMN "version_number" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_storage_key_key" ON "document_versions"("storage_key");

-- CreateIndex
CREATE INDEX "document_versions_uploader_id_idx" ON "document_versions"("uploader_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_document_id_version_number_key" ON "document_versions"("document_id", "version_number");

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
