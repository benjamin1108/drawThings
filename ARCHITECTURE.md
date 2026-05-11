# DrawThings Architecture

DrawThings is a vanilla Node.js HTTP server with static browser pages. The first refactor phase keeps the no-build-chain model and separates CSS, browser modules, server routes, services, and low-level libraries.

## Runtime

- Start the UI server with `npm run ui`.
- Run all guardrails with `npm run check`.
- Run the Playwright smoke harness with `npm run test:smoke`.
- Browser code uses native ESM loaded directly from `public/js/**`.
- CSS uses browser-native `@import` from `public/styles.css`.

## Baseline Report

The refactor started from the harness facts:

| Area | Baseline |
|---|---:|
| `public/styles.css` | 4,875 lines |
| `public/app.js` | 1,038 lines |
| `public/edit.js` | 520 lines |
| `public/audit.js` | 634 lines |
| `src/server.js` | 1,229 lines |

Current scale after the architecture split:

| Area | Current |
|---|---:|
| `public/styles.css` | 14 lines |
| largest CSS module | 449 lines, `public/css/pages/audit.css` |
| `public/js/home/index.js` | 97 lines |
| `public/js/edit/index.js` | 104 lines |
| `public/js/audit/index.js` | 104 lines |
| largest browser module | 323 lines, `public/js/home/generation.js` |
| `src/server.js` | 3 lines |
| largest route | 53 lines, `src/server/routes/tasks.js` |
| largest service | 353 lines, `src/server/services/image-service.js` |

## Selector Map

CSS selectors are owned by layer:

- `00-tokens.css`: one `:root` token block.
- `01-reset.css`: element reset only.
- `02-base.css`: stable utilities such as `.hidden`, `.visually-hidden`, `.skip-link`, `.eyebrow`.
- `03-layout.css`: app shell placement for `.app`, `.workspace`, `.history-sidebar`, `.edit-shell`, `.audit-shell`.
- `components/buttons.css`: `.chip-button`, `.primary-button`, `.hint-chip`, icon/action button variants.
- `components/fields.css`: `.setting-field`, `.edit-field`, `.audit-field`.
- `components/topbar.css`: `.topbar`, `.brand`, `.topbar-actions`.
- `components/status.css`: `.status`, `.edit-status`, `.audit-status`, `.audit-status-pill`.
- `components/modal.css`: `.lightbox`, `.edit-viewer`.
- `components/media-rail.css`: `.audit-media`, `.audit-thumbs`, `.audit-thumb`.
- `pages/home.css`: home-only composition classes such as `.coverflow-*`, `.fancard`, `.chatbox-*`, `.history-*`, `.canvas-*`.
- `pages/edit.css`: `.edit-*`, `.dropzone`, `.description-editor`, `.reference-preview`, `.result-*`.
- `pages/audit.css`: `.audit-*` board, list, card, prompt, metrics, toolbar.

Legacy generic selectors `.page`, `.composer`, `.gallery`, `.button`, `.field` are not present in the active CSS. The HTML entries use page namespaces or shared component classes.

## Frontend

Each HTML page loads exactly one page entry:

- `/` -> `public/js/home/index.js`
- `/edit.html` -> `public/js/edit/index.js`
- `/audit.html` -> `public/js/audit/index.js`

Shared browser utilities live in `public/js/shared`:

- `api-client.js`: JSON fetch helpers and API calls.
- `dom.js`: small DOM lookup and mutation helpers.
- `storage.js`: localStorage keys and helpers.
- `format.js`: escaping, time, latency, bytes, and ids.
- `a11y.js`: focus and aria helpers.
- `media.js`: image URLs, object URLs, and downloads.

Page modules:

- `home/coverflow.js`: style browser and selection state.
- `home/generation.js`: image task creation, polling, canvas state.
- `home/history.js`: IndexedDB history.
- `home/ui.js`: lightbox, persistence, sidebar, page bindings.
- `edit/upload.js`: upload, drag/drop, paste, progress.
- `edit/description.js`: reference image description.
- `edit/result-viewer.js`: regeneration, result preview, viewer.
- `audit/auth.js`: session, login, logout.
- `audit/filters.js`: search, status filter, pagination.
- `audit/render.js`: summary and audit cards.
- `audit/media.js`: reference/result media rail.

## CSS

`public/styles.css` is an import manifest only. Modules are ordered by architecture layer:

1. `00-tokens.css`
2. `01-reset.css`
3. `02-base.css`
4. `03-layout.css`
5. `04-motion.css`
6. `components/*.css`
7. `pages/*.css`

The architecture check enforces:

- `public/styles.css` is under 80 lines and contains only imports/comments.
- Every CSS module is under 450 lines.
- `:root` exists only in `00-tokens.css`.
- Legacy generic selectors `.page`, `.composer`, `.gallery`, `.button`, `.field` are not present.
- Duplicate simple selector definitions are rejected.

## Backend

`src/server.js` is a compatibility entry that starts `src/server/index.js`.

Server layers:

- `server/index.js`: creates and listens on the HTTP server.
- `server/app.js`: builds the route table and central error handling.
- `server/router.js`: method/path matching and params.
- `server/routes`: HTTP input/output only.
- `server/lib`: HTTP, cookies, multipart, paths, validation.
- `server/services`: sessions, audit store, file store, image tasks, styles.

Route map:

- `GET /api/styles`
- `GET /api/styles/:styleId`
- `POST /api/reference-files`
- `POST /api/image-description`
- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `GET /api/tasks/:taskId/images/:imageIndex`
- `POST /api/ppt`
- `GET /api/admin/session`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/audit`
- `GET /api/audit/:auditId`
- `GET /api/audit-image`
- `GET /*` static files from `public`

## Verification

The smoke harness starts a server on a random local port with `ADMIN_PASSWORD` set, then checks desktop `1440x900` and mobile `390x844` for:

- home topbar, prompt form, style selector, and no horizontal overflow;
- edit upload/dropzone, description editor, result panel, and no horizontal overflow;
- audit logged-out login-only panel and no horizontal overflow;
- audit login, summary/list visibility, and media rail behavior when media exists.
