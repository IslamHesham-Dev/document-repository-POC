# New-document upload API

Use `POST /api/documents` with `multipart/form-data` and an `X-User-Id` header for an existing user.

| Field | Required | Format |
| --- | --- | --- |
| `file` | Yes | PDF, DOCX, or UTF-8 text file, maximum 10 MB |
| `title` | Yes | Text, 1–255 characters after trimming |
| `tags` | No | JSON string array, repeated fields, or comma-separated text |
| `permittedDepartmentIds` | No | JSON string array, repeated fields, or comma-separated UUIDs |
| `accessScope` | No | `RESTRICTED` (default) or `ALL_DEPARTMENTS` |

`ALL_DEPARTMENTS` cannot be combined with `permittedDepartmentIds`.

The uploader is always taken from the verified request context, never from a form field. A successful request returns `201` with the document, uploader, normalized tags, permitted departments, and version 1 metadata.
