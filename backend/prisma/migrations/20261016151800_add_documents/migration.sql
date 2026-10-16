-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "uploader_id" UUID NOT NULL,
    "current_version_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_current_version_id_key" ON "documents"("current_version_id");

-- CreateIndex
CREATE INDEX "documents_uploader_id_idx" ON "documents"("uploader_id");

-- CreateIndex
CREATE INDEX "documents_title_idx" ON "documents"("title");

-- CreateIndex
CREATE INDEX "documents_deleted_at_idx" ON "documents"("deleted_at");

-- CreateIndex
CREATE INDEX "document_versions_document_id_idx" ON "document_versions"("document_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
