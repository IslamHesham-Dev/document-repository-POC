# Frontend version upload and search

The document details route loads document metadata and version history for the
selected POC user. Uploaders and administrators see an **Upload new version**
action. Department-only viewers see read-only access. A successful upload
refreshes both details and history, while the form explains that older versions
remain immutable and downloadable.

The documents route provides title, tag, and uploader filters with explicit
Search and Clear actions. Results show title, tags, uploader, current version,
last update time, and a detail link. Loading, empty, and API-error states are
handled separately. Previous and Next controls change only the page number, so
the applied filters remain intact while navigating result pages.
