-- Enable trigram matching for efficient case-insensitive partial title searches.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Replace the title B-tree index with a trigram GIN index.
DROP INDEX "documents_title_idx";
CREATE INDEX "documents_title_trgm_idx"
ON "documents" USING GIN ("title" gin_trgm_ops);

-- Support newest-first document listings.
CREATE INDEX "documents_created_at_idx"
ON "documents" ("created_at" DESC);

-- Replace the single-column relationship index with one that also supports
-- newest-first version history for each document.
DROP INDEX "document_versions_document_id_idx";
CREATE INDEX "document_versions_document_id_uploaded_at_idx"
ON "document_versions" ("document_id", "uploaded_at" DESC);
