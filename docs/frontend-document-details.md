# Document detail interface

The document detail page presents the document title, uploader, tags, access scope, permitted departments, current version, and creation and update dates. The current file has a prominent authenticated download action.

Version history is ordered newest first. Every entry shows its version number, original filename, size, uploader, upload date, current-version status, and its own authenticated download action. Downloads use the selected POC user's `X-User-Id` header, so the browser never exposes a broken direct link that omits the required identity context.

The page translates `403 Forbidden` and `404 Not Found` responses into clear guidance. Both error states include a route back to document search. Other loading or network failures use the shared status component.
