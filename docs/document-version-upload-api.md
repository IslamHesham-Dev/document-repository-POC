# New-version upload API

Use `POST /api/documents/:documentId/versions` with `multipart/form-data` and
an `X-User-Id` header for an existing user.

| Field | Required | Format |
| --- | --- | --- |
| `file` | Yes | PDF, DOCX, or UTF-8 text file, maximum 10 MB |

Only the original uploader or an administrator may add a version. Department
access remains read-only.

A successful request returns `201` with the immutable version metadata. The
server calculates the next version number, updates the document's current
version pointer, and retains every earlier version.

The document row is locked during the database transaction. This prevents two
simultaneous uploads from receiving the same version number. If the database
transaction fails after the file is stored, the new file is removed and the
API returns a standard error response.

Common errors:

| Status | Code | Meaning |
| --- | --- | --- |
| `400` | `INVALID_DOCUMENT_ID` | The route ID is not a UUID. |
| `400` | `FILE_REQUIRED` | No file was supplied. |
| `400` | `EMPTY_FILE` or `UNSUPPORTED_FILE_TYPE` | The file failed validation. |
| `403` | `DOCUMENT_MODIFICATION_DENIED` | The user may not modify this document. |
| `404` | `DOCUMENT_NOT_FOUND` | The active document does not exist. |
| `413` | `FILE_TOO_LARGE` | The file exceeds the configured limit. |
| `500` | `VERSION_UPLOAD_FAILED` | The version could not be saved safely. |
