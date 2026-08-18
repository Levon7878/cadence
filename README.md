# Cadence — Delivery Operations Platform

Cadence is a production-grade B2B SaaS front-end for running a services/delivery
organization: projects and tasks, team capacity, delivery analytics, role-based
administration, and billing — all driven by a single, interconnected data model.

It is built as a **portfolio-defining demonstration of senior front-end
engineering**: a coherent product with realistic workflows, a strong layered
architecture, first-class accessibility, and disciplined state management. Every
screen reads from the same mock backend and the same domain model — change a task
and project health, dashboard KPIs, team utilization, the activity log, and
notifications all update accordingly.

> **The data is interconnected by design.** Metrics like project progress,
> milestone progress, member utilization, and project health are *derived* from
> the underlying tasks and capacity, never hardcoded.

## Highlights

- **Dashboard** — 5 derived KPIs with trends, sparklines and period comparison,
  delivery-velocity and project-distribution charts, at-risk projects, upcoming
  deadlines, and a live activity feed.
- **Projects** — searchable/filterable data table; project detail with an
  Overview (health reasoning, budget burn, milestones), a **Kanban board** with
  drag-and-drop + optimistic status updates, a list view, an activity stream, and
  members.
- **Analytics** — URL-driven date ranges, comparison periods and filters; velocity,
  utilization, on-time delivery and budget-burn trends; a project breakdown table;
  permission-gated **CSV export**.
- **Team** — capacity, allocation and utilization with over-allocation detection;
  a workload drawer where reassigning a task instantly ripples into utilization.
- **Members (admin)** — invite, assign roles, and deactivate members with
  permission-aware actions.
- **Billing (owner)** — subscription, usage vs. limits, plan comparison, payment
  method, and invoices.
- **Settings** — profile, appearance (light/dark/system), notifications, security,
  organization, and a read-only role/permission matrix.
- **App shell** — collapsible sidebar, command palette (`⌘/Ctrl + K`),
  notifications, theme toggle, and a **dev-only role switcher**.
- **Every surface** has intentional loading, empty and error states, and is
  responsive from mobile to desktop.

## Tech stack

React 19 · TypeScript (strict) · Vite · React Router · TanStack Query · Zustand ·
Axios · React Hook Form · Zod · Tailwind CSS (semantic CSS-variable tokens) ·
Recharts · Lucide · MSW · Vitest · React Testing Library.

## Architecture

Feature-sliced, layered, with a strictly downward dependency direction enforced by
ESLint (`import/no-restricted-paths`):

```
app → pages → widgets → features → entities → shared
```

- **shared** — design system/UI primitives, Axios client, query keys, RBAC policy,
  hooks, formatting/CSV utilities, tokens.
- **entities** — domain types, DTO→domain mapping (Zod), query/mutation hooks, and
  small presentational domain components (badges, avatars, utilization bars).
- **features** — user interactions (auth forms, task board, task drawer, invite,
  RBAC gate + role switcher).
- **widgets** — page sections composed from features/entities (app shell, KPI grid,
  charts, activity feed, project overview).
- **pages** — thin route components that compose widgets. No API calls or business
  logic live in pages.

See [`DECISIONS.md`](./DECISIONS.md) for the full architectural decision record,
including the critical review of the spec and the trade-offs made.

## Getting started

Requirements: Node 18+.

```bash
npm install
cp .env.example .env   # optional; sensible defaults are baked in
npm run dev
```

Open the printed URL. The app boots a **Mock Service Worker** backend with a
deterministic, seeded dataset (1 org, multiple workspaces, 25–40 members, 15–25
projects, 200+ tasks, milestones, comments, activities, notifications and billing),
so it runs fully client-side with no server to configure.

### Demo credentials

The login form is pre-filled — just click **Sign in**.

| Field | Value |
| --- | --- |
| Email | `alex.morgan@cadence.dev` |
| Password | `password` |

### Trying different roles

Use the **Demo role** switcher in the top bar (development only) to instantly view
the app as an Owner, Admin, Manager, Member or Viewer. The override is applied both
to the UI *and* to outgoing requests (`X-Demo-Role`), so the mock backend enforces
that role too — hiding a button is never treated as sufficient authorization.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with the MSW backend |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run test` | Run the test suite (Vitest + RTL + MSW) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint (ESLint, incl. layer boundaries + a11y) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run format` | Prettier |

## Testing

Tests are prioritized by risk rather than coverage count: the RBAC policy, a
critical journey (task change → derived health/utilization ripple), an optimistic
update **with rollback**, form validation/accessibility, and core UI. MSW backs the
node tests so requests exercise the same handlers as the app.

```bash
npm run test
```

## Security & backend readiness

- **Front-end RBAC is a UX and defense-in-depth boundary only.** Real authorization
  must be enforced by a backend. In this project the MSW layer re-checks the caller's
  role on every mutation and returns real `403`s to demonstrate the pattern.
- No secrets are committed; configuration is read from environment variables
  (`.env.example`). External links use `rel="noopener noreferrer"`.
- The API boundary (Axios client + typed DTO→domain mappers + query-key factories)
  is isolated, so swapping MSW for a real REST backend touches only `shared/api` and
  the entity mappers — not the UI.

## Project structure

```
src/
  app/          # providers, router, guards, entry point
  pages/        # thin route components
  widgets/      # composed page sections (app shell, dashboard, charts, ...)
  features/     # interactions (auth, rbac, task board/drawer/create, invite)
  entities/     # domain types, api/query hooks, mappers, domain UI
  shared/       # design system, api client, rbac policy, hooks, utils, tokens
  mocks/        # MSW handlers + deterministic seed + derivation/analytics
  test/         # test setup & helpers
```
