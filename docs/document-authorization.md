# Document authorization

`PermissionService` is the single source of document-access rules:

1. Administrators can access every existing document.
2. Uploaders can access their own documents.
3. Employees can access documents with `ALL_DEPARTMENTS` scope.
4. Employees can access restricted documents explicitly permitted for their department.
5. Everyone else receives `403 DOCUMENT_ACCESS_DENIED`.

All document features must reuse these integration points:

| Feature | Required integration |
| --- | --- |
| Search and document lists | Pass `PermissionService.getAccessibleDocumentWhere(currentUser)` into the document query. |
| Document details | Run `requireDocumentAccess` before the controller. |
| Version history | Run `requireDocumentAccess` before the controller. |
| File viewing and downloads | Run `requireDocumentAccess` before resolving or streaming a storage key. |

Controllers and repositories must not recreate these rules independently.

## Modification rules

Viewing permission does not automatically allow editing. Only these users may
upload a new version:

1. An administrator.
2. The document's original uploader.

Employees who can view a document through their department or through
`ALL_DEPARTMENTS` receive `403 DOCUMENT_MODIFICATION_DENIED` if they try to
upload a version. Version upload uses
`PermissionService.requireDocumentModification`, keeping this rule reusable.
