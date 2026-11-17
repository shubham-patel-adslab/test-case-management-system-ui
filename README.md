# TCMS UI

React frontend for the Test Case Management System.

- Requirements: [document/prd.md](document/prd.md) (full assignment) and
  [document/ui-requirements.md](document/ui-requirements.md) (UI scope and API contract).

## Tech stack

React 19 (React Compiler) · TypeScript · Vite · Ant Design · React Router · TanStack Query · axios ·
react-hook-form + zod · i18next · MSW (mock API in development)

## Local development

Requires Node 24 (see `.nvmrc`).

```bash
nvm use
npm install
npm run dev
```

With mocking on (`VITE_TCMS_API_MOCKING=true`), the app runs against the MSW mock API, so no backend is
required.

## Signing in

Every page except `/sign-in` needs a signed-in user. There is no registration: an admin creates users.

- **Mock API:** one test account per role (admin, test lead, tester, read-only) plus a deactivated one,
  all with the same password — see `src/features/user/mock/user.mock.data.ts`. The mock session survives a
  reload within the browser tab. A user invited in mock mode gets no email: the mock prints the
  set-password link in the browser console instead.
- **Real backend:** the first admin is created in tcms-api with `npm run admin:create` (password from its
  `INITIAL_ADMIN_PASSWORD` env). That admin invites the other users from **Users**; each invitee gets an
  email (Mailpit in development) with a `/set-password` link and chooses their own password.

## Environment

| Variable | Purpose | Default (`.env.development`) |
| --- | --- | --- |
| `VITE_TCMS_API_URL` | API root the axios client calls | `/api` |
| `VITE_TCMS_API_MOCKING` | `true` serves API calls from MSW mocks (dev only) | `true` |

To use a locally running backend (tcms-api on port 3000), create `.env.development.local` (git-ignored):

```bash
VITE_TCMS_API_MOCKING=false
```

The Vite dev server proxies `/api` to `http://localhost:3000`, so `VITE_TCMS_API_URL` stays `/api` and
the browser sees one origin (no CORS).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Lint with type-aware ESLint rules |
| `npm run preview` | Serve the production build locally |

## Project structure

```text
src/
├── app/            # bootstrap: providers, router, i18n, axios client, MSW setup
├── features/       # one folder per domain (project, test-case, test-suite, …)
├── shared/         # cross-feature components (layout, loading state), i18n
└── styles/         # global SCSS partials
```
