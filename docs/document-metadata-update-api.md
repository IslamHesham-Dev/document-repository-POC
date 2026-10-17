# Document metadata update API

Use `PATCH /api/documents/:documentId` with a JSON body and an `X-User-Id`
header. Only the original uploader or an administrator may update metadata.

Supported fields are optional, but at least one must be provided:

| Field | Format | Behavior |
| --- | --- | --- |
| `title` | String, 1–255 characters | Replaces the title after whitespace normalization. |
| `tags` | Array of strings | Replaces all tags; an empty array clears them. |
| `permittedDepartmentIds` | Array of UUIDs | Replaces department permissions; an empty array clears them. |
| `accessScope` | `RESTRICTED` or `ALL_DEPARTMENTS` | Changes department visibility. |

Supplying department IDs without an access scope makes the document
`RESTRICTED`. Setting `ALL_DEPARTMENTS` removes explicit department permissions
and cannot be combined with a non-empty department list.

The update is atomic. It updates the document's `updatedAt` timestamp but does
not create, delete, or modify any file version. The response uses the same safe
shape as the document-details endpoint.
