# Document details and version history APIs

Both endpoints require an `X-User-Id` header and apply the shared document
permission rules. Missing active documents return `404 DOCUMENT_NOT_FOUND`, and
users without access receive `403 DOCUMENT_ACCESS_DENIED`.

## Document details

Use `GET /api/documents/:documentId`.

The response includes the title, uploader, normalized tags, access scope,
permitted departments, current version, creation and update dates, and safe
download information. The download `href` identifies the API endpoint for the
current file; it is not a filesystem path.

## Version history

Use `GET /api/documents/:documentId/versions`.

Versions are returned newest first. Each entry includes its version number,
uploader, original filename, MIME type, file size, upload date, and whether it
is the current version.

Neither response exposes a storage key or physical filesystem path.
