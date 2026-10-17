# Document search API

Use `GET /api/documents` with an `X-User-Id` header for an existing user.

| Query parameter | Default | Meaning |
| --- | --- | --- |
| `title` | none | Case-insensitive partial title match. |
| `tag` | none | Exact normalized tag name. Repeat it or use commas to require multiple tags. |
| `uploaderId` | none | Exact uploader UUID. |
| `page` | `1` | Page number, starting at 1. |
| `pageSize` | `20` | Results per page, from 1 to 100. |
| `sortBy` | `createdAt` | `createdAt`, `updatedAt`, or `title`. |
| `sortOrder` | `desc` | `asc` or `desc`. |

All supplied filters are combined. For example:

```http
GET /api/documents?title=policy&tag=finance&uploaderId=UUID&page=1&pageSize=20&sortBy=title&sortOrder=asc
```

Results always exclude soft-deleted documents and apply the shared permission
rules before pagination. An employee sees their own documents, documents shared
with all departments, and documents permitted for their department. An admin
can see every active document.

The response contains `documents`, `pagination`, and `sorting`. Storage keys are
not exposed in search results.
