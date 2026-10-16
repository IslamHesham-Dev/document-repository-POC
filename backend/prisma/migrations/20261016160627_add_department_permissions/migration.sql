-- CreateEnum
CREATE TYPE "DocumentAccessScope" AS ENUM ('RESTRICTED', 'ALL_DEPARTMENTS');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "access_scope" "DocumentAccessScope" NOT NULL DEFAULT 'RESTRICTED';

-- CreateTable
CREATE TABLE "document_department_permissions" (
    "document_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_department_permissions_pkey" PRIMARY KEY ("document_id","department_id")
);

-- CreateIndex
CREATE INDEX "document_department_permissions_department_id_idx" ON "document_department_permissions"("department_id");

-- AddForeignKey
ALTER TABLE "document_department_permissions" ADD CONSTRAINT "document_department_permissions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_department_permissions" ADD CONSTRAINT "document_department_permissions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
