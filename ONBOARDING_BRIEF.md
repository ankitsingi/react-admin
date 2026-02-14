# Full-Stack Engineer Onboarding Brief (react-admin monorepo)

## 1) The Big Picture (Architecture)

### Primary tech stack
- **Frontend**: TypeScript + React + Material UI, organized as reusable packages (`ra-core`, `ra-ui-materialui`, `react-admin`) and runnable examples. The main `<Admin>` entrypoint composes app-wide context/providers and UI shell.  
- **Backend**: No single backend service in this repo. Instead, react-admin uses a **Data Provider adapter** contract to talk to any backend. The core contract is in `ra-core` types (`getList`, `getOne`, `create`, `update`, etc.).
- **Database / Storage**:
  - In production projects: external DB behind REST/GraphQL APIs (outside this repo).
  - In examples: either client-side/mocked data providers or hosted APIs. CRM uses `ra-data-simple-rest` pointed at `https://crm.api.marmelab.com` and localStorage for user identity state.

### Architectural pattern
- **Monorepo + framework architecture**:
  - `packages/*`: framework libraries and adapters.
  - `examples/*`: reference applications.
- Runtime architecture is **SPA (frontend-heavy) + API adapter pattern**. There is no tight MVC backend in this repo.

### Frontend/backend communication
- Primary mechanism: **Data Provider methods** abstracting transport.
- Out of the box, this repo supports both **REST** and **GraphQL** adapters (`ra-data-simple-rest`, `ra-data-graphql`, `ra-data-graphql-simple`).
- In CRM specifically, communication is REST via `ra-data-simple-rest` to `https://crm.api.marmelab.com`.

## 2) The Data Journey (Logic Flow)

### Example critical flow: “Create Contact” in CRM
1. **User action in UI**
   - `ContactCreate` renders `<CreateBase>` + `<Form>` and defines a `transform` for derived fields (`first_seen`, `last_seen`, etc.).
2. **Controller layer / mutation orchestration**
   - `<CreateBase>` delegates to `useCreateController`.
   - `useCreateController` handles auth/access checks, success/error notifications, redirect behavior, and calls `useCreate`.
3. **Data provider call**
   - `useCreate` invokes `dataProvider.create(resource, params)` via React Query mutation flow.
4. **Business logic in CRM provider**
   - CRM data provider wraps a simple REST provider with lifecycle callbacks (`withLifecycleCallbacks`) and custom methods.
   - These callbacks implement domain rules (e.g., normalizing avatars/logos, preserving cross-entity consistency, ownership reassignment).
5. **Persistence**
   - Base call goes through `ra-data-simple-rest` and emits `POST /<resource>` to remote API.

### Where the heavy lifting lives
- **Framework-level orchestration**: in `ra-core` controller/data hooks (auth checks, mutation modes, caching, notifications).
- **Domain/business rules for an app**: in app-specific data provider wrappers/callbacks (e.g., CRM `dataProvider.ts`).
- **UI** generally remains declarative and light, delegating important logic to controllers/hooks/provider callbacks.

## 3) Standards & Governance

### State management patterns
- Server state + async cache: **TanStack React Query** (`QueryClientProvider` in `CoreAdminContext`).
- App/platform contexts: `AuthContext`, `DataProviderContext`, i18n, notifications, store/preferences contexts.
- User preferences/state: configurable store (`memoryStore` by default, `localStorageStore` often used in apps).

### Error handling patterns
- Mutations centralize success/error handling in controllers (`useCreateController`):
  - success notifications + redirects
  - error notifications
  - validation errors (HTTP error body) returned to forms without duplicate generic notifications
- REST adapter throws explicit errors for malformed responses (e.g., missing pagination headers in list endpoints).

### Authentication/security patterns
- Auth is provider-based (`AuthProvider` interface: `login`, `logout`, `checkAuth`, `checkError`, `getIdentity`, `canAccess`).
- Access control uses capability checks (`canAccess`) and controller-level guards (`useRequireAccess`).
- In CRM example, identity is stored in localStorage and role-based access is derived from an `administrator` flag.

### “Golden rules” for compliance/security in this repo
- Respect the **provider contracts** (`DataProvider`, `AuthProvider`) instead of bypassing them.
- Keep sensitive concerns out of UI components; enforce access rules in auth/provider/controller layers.
- Follow repository standards: monorepo scripts via `make`/`yarn`, linting, unit tests, and e2e workflows.

## 4) The First Ticket (Where to Start)

Recommended first files:
1. `packages/react-admin/src/Admin.tsx` — top-level composition and entrypoint behavior.
2. `packages/ra-core/src/core/CoreAdminContext.tsx` — all foundational contexts (auth/data/query/router/i18n).
3. `examples/crm/src/root/CRM.tsx` — real app wiring of resources, auth provider, data provider, routes.

Technical debt / complex areas to watch:
- CRM activity aggregation notes a perf concern: currently requires multiple large queries.
- CRM comments indicate missing reusable hooks/exports from core for some app logic.
- Any workflow involving lifecycle callbacks and cross-entity updates in CRM data provider is powerful but can become complex quickly.

## 5) Actionable Next Steps (Commands)

From repo root:

```bash
# 1) Install dependencies
make install

# 2) Build packages
make build

# 3) Run a primary app (fastest dev loop)
make run-simple

# 4) Run CRM example
make run-crm

# 5) Primary test suites
make test-unit
make test-e2e

# 6) Quality checks
make lint
```

Notes:
- Full aggregate pipeline exists as `make test` (includes build + unit + lint + e2e).
- e2e depends on the cypress workspace and can be slower/heavier than unit tests.
