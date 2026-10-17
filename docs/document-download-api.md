# Document version download API

Use `GET /api/documents/:documentId/versions/:versionId/download` with an
`X-User-Id` header for an existing user.

The endpoint verifies that:

1. The active document exists.
2. The current user can access that document.
3. The requested version belongs to that document.
4. The stored file still exists.

The response streams the stored file instead of loading it into application
memory. It returns the saved MIME type through `Content-Type`, the original
filename through `Content-Disposition`, the size through `Content-Length`, and
adds `X-Content-Type-Options: nosniff`.

Possible errors include:

| Status | Code | Meaning |
| --- | --- | --- |
| `400` | `INVALID_DOCUMENT_ID` | The document ID is not a UUID. |
| `400` | `INVALID_VERSION_ID` | The version ID is not a UUID. |
| `403` | `DOCUMENT_ACCESS_DENIED` | The user cannot access the document. |
| `404` | `DOCUMENT_NOT_FOUND` | The active document does not exist. |
| `404` | `DOCUMENT_VERSION_NOT_FOUND` | The version is not part of the document. |
| `404` | `STORED_FILE_NOT_FOUND` | Metadata exists, but its stored file is missing. |
