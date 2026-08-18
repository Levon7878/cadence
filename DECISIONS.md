# Architectural Decision Record — Cadence

This document captures the important, non-obvious decisions made while building
Cadence. Each entry states the decision, the reasoning, and the trade-offs.

## 0. Critical review of the specification

The specification is intentionally maximal. Following section 0 (and the priority
order: correctness → coherence → maintainability → …), several requirements were
scoped down to avoid over-engineering while preserving the intent:

- **Breadth over exhaustive depth.** The goal is a *coherent* product that
  demonstrates senior engineering, not a literal implementation of every widget.
  Each domain area is implemented end-to-end for the primary journeys; secondary
  surfaces (e.g. some settings sub-tabs) are implemented as focused, real forms
  rather than fully backed CRUD to avoid fake complexity.
- **One design system, one data spine.** Every screen reads from the same MSW
  backend and the same domain model. There are no disconnected mock widgets.
- **Derived, not hardcoded, metrics.** Project progress, milestone progress,
  member utilization, and project health are *computed* from tasks/capacity, not
  stored as magic numbers. Dashboard KPIs aggregate the same domain data.

## 1. Framework & tooling

- **Vite + React 19 + TypeScript (strict).** Fast dev server, first-class ESM,
  and strict typing across the board. `any`, `@ts-ignore`, and rule-disabling
  are avoided.
- **Tailwind CSS v3 with semantic CSS-variable tokens.** Tailwind v3 is chosen
  over v4 for stability of the CSS-variable token pattern. Colors are defined as
  HSL channel triplets in CSS variables (`--primary: 221 83% 53%`) and consumed
  via `hsl(var(--primary) / <alpha-value>)`, so a single token drives both Tailwind
  utilities and raw CSS, and light/dark themes swap by re-declaring variables.

## 2. Layered / feature-sliced architecture

Dependency direction is strictly downward:

```
app → pages → widgets → features → entities → shared
```

Enforced by ESLint `import/no-restricted-paths`. Lower layers never import from
higher layers. Each slice exposes a public `index.ts` barrel; deep cross-feature
imports are disallowed.

- **entities/** own domain types, DTO→domain mappers, query hooks, and small
  presentational domain components (badges, avatars).
- **features/** own user interactions (task board, invite form, role switcher).
- **widgets/** compose features/entities into page sections (KPI grid, activity feed).
- **pages/** are thin route components that compose widgets. No API calls or
  business logic live in pages.

## 3. State ownership

| Concern | Owner | Why |
| --- | --- | --- |
| Server data | TanStack Query | caching, invalidation, background refetch, optimistic |
| Auth/session, theme, sidebar, command palette, demo role | Zustand | small global client state, some persisted |
| Filters / search / pagination / sort / analytics range | URL search params | shareable & restorable view state |
| Forms | React Hook Form + Zod | validation + accessibility |
| Ephemeral component state | useState | local only |

Server state is **never** mirrored into Zustand. The demo role override lives in
Zustand because it is a client-only concern that changes the *view* of permissions.

## 4. API layer & real-backend readiness

- Components never call Axios. All access flows through
  `entities/*/api` → `entities/*/model` (query hooks) using a shared Axios client
  and centralized **query-key factories**.
- A single Axios instance injects the auth token and normalizes every error into
  a typed `ApiError { status, code, message, fieldErrors? }` via interceptors.
- **DTO → mapper → domain model** separation means UI never depends on raw
  response shapes. Swapping MSW for a real backend is isolated to `shared/api`
  and the mapper layer.
- **MSW** simulates latency, pagination, sorting, filtering, search, validation
  errors, and 401/403/404/500. It is a real network boundary (Axios makes real
  `fetch`/XHR requests intercepted by the Service Worker in the browser and by the
  node server in tests).

## 5. RBAC

Permissions are centralized in `shared/lib/permissions` as a pure
`can(user, action, resource?)` policy table, exposed via `usePermissions()` and a
`<Can>` component. RBAC is enforced at three levels:

1. **Routing** — `<RequirePermission>` guards protected routes → `/403`.
2. **UI affordances** — `<Can>` hides/disables actions.
3. **Mutation** — MSW re-checks the caller's role and returns real `403`s, which
   surface as toasts. Hiding a button is explicitly *not* treated as sufficient.

A clearly-marked **demo role switcher** (dev-only, tree-shaken from production via
`import.meta.env.DEV`) lets reviewers experience every role without extra accounts.

> Frontend RBAC is a UX and defense-in-depth boundary only. Real authorization
> must be enforced by the backend. This is stated in the README.

## 6. Dates

Native `Intl` is used for formatting. `date-fns` is introduced for range math
(quarter-to-date, previous-period/previous-year comparisons, deadline diffs)
because reimplementing correct calendar arithmetic would be error-prone and is
explicitly discouraged by the spec. No bespoke date framework is built.

## 7. Testing

Vitest + RTL + MSW (node). Tests are prioritized by risk, not coverage count:
RBAC policy, a critical journey (task reassignment → utilization/health update),
optimistic update + rollback, form validation, and core UI primitives.

## 8. Performance

Route-level `lazy()` + Suspense, query caching with tuned `staleTime`/`gcTime`,
debounced search, and query-key-scoped invalidation. Memoization and virtualization
are applied only where measured/obvious (large task lists), not blanket-applied.

## 9. Notable scope decisions

- **Drag-and-drop board:** implemented with the native HTML Drag and Drop API
  rather than adding a DnD dependency, keeping the dependency list lean.
- **CSV export:** built with a tiny local serializer (no dependency) and gated by
  permission.
- **Charts:** Recharts, wrapped in a `ChartCard` that always provides an
  accessible text summary of the data for screen readers.
