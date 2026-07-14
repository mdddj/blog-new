# Resume Display Design

## Scope

The site stores one current HTML resume. An authenticated administrator can select an `.html` file, preview it, and publish it. Visitors can open `/resume` and print only the resume document.

## Architecture

- PostgreSQL stores the file name, full HTML content, and timestamps in a singleton `resume` row.
- `GET /api/v1/resume` is public. `GET` and `PUT /api/v1/admin/resume` use the existing admin authentication middleware.
- Both frontend previews render the document with `iframe.srcDoc`. The sandbox allows same-origin access for printing but does not allow scripts, top navigation, popups, or downloads.
- Uploads are limited to `.html`, non-empty content, and 2 MB on both client and server.

## Verification

- Backend unit tests cover the upload validation boundary.
- Rust formatting, tests, and compilation verify the API implementation.
- ESLint and the production Next.js build verify the frontend.
- Browser QA covers the public empty/published state, admin selection and preview, print control, and desktop/mobile layout where the local services permit it.
