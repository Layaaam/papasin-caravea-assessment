# Expense Tracker

A single-user expense tracking web app: create, search, filter, sort, and manage expenses through an Inertia-powered React interface backed by Laravel.

Built for a technical assessment. Full functional/technical requirements are in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md); the build log and verification history are in [`docs/IMPLEMENTATION_PHASES.md`](docs/IMPLEMENTATION_PHASES.md).

## Stack

- **Backend:** Laravel 13, PHP 8.3+, Inertia 3, PHPUnit
- **Frontend:** React 19, Inertia React 3, TypeScript (strict), Vite, Tailwind CSS 4, shadcn/ui, Vitest + React Testing Library
- **Database:** PostgreSQL

## Features

- Full CRUD on expenses (title, amount, category, date, notes)
- Predefined categories
- Search by title, filter by category and date range, sort on any column, server-side pagination
- Peso (`₱`) formatting with decimal-safe storage (no floating-point money)
- Loading, empty, no-results, validation, and error states handled end-to-end
- Allowlisted sort/filter inputs and safely-rendered free text (no injection, no XSS)

## Getting started

```bash
# 1. Install dependencies
composer install
npm install

# 2. Set up environment
cp .env.example .env
php artisan key:generate
```

Then open `.env` and fill in your PostgreSQL credentials:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=caravea-assessment
DB_USERNAME=credentials here
DB_PASSWORD=credentials here
```

```bash
# 3. Create the database, if not already
createdb caravea-assessment

php artisan migrate:fresh --seed       # seeds the database with sample expenses

# 4. Run the app
composer run dev
```

`composer run dev` runs the Laravel server, queue listener, and Vite dev server together. The app is served at `http://localhost:8000`.

### Running tests / quality gates

```bash
composer test           # PHPUnit (backend)
vendor/bin/pint         # PHP formatting
npm run typecheck       # TypeScript
npm run lint            # ESLint
npm test -- --run       # Vitest (frontend)
npm run build           # production build
```

## Why it's built this way

**Route → Controller → Form Request → Eloquent Model → Resource → Inertia.** Routes are thin, `ExpenseController` only coordinates, and validation lives in dedicated Form Requests (`ListExpenseRequest`, `StoreExpenseRequest`, `UpdateExpenseRequest`). The resource keeps expense serialization stable while Inertia supplies the page props and redirect protocol.

**Page/Component → Inertia router/useForm → Laravel web route.** React uses Inertia for list visits and mutations rather than a parallel fetch service. Search, filters, sorting, page size, and pagination are reflected in the URL; Laravel remains authoritative for validation and server-side querying.

**Allowlisted sorting and filtering.** sort, direction, category, and the date-range parameters are validated against an explicit allowlist in `ListExpenseRequest` before they ever reach a query. User input is never interpolated into an ordering or `where` clause directly, and every sort includes `id` as a deterministic tie-breaker so pagination never reshuffles rows with equal values.

**Reusable Eloquent scopes over ad-hoc query building.** Case-insensitive title search, exact category matching, and inclusive date-range filtering are implemented as small, named scopes on `Expense` rather than inline query chains in the controller, so the same filtering logic is testable and reusable outside `index()`.

**`Asia/Manila` as the application timezone.** Non-future-date validation and date formatting are timezone-sensitive, so APP_TIMEZONE is set explicitly instead of left on UTC, which matches the intended Philippine context called out in the requirements.

**Tests assert behavior and database state, not implementation details.** PHPUnit feature tests assert Inertia page props, redirects, flash data, validation errors, and persistence. Vitest/RTL tests exercise page behavior while mocking the Inertia router boundary, so frontend tests never depend on a running server.

## AI usage disclosure

**Tools:** OpenAI Codex, GPT‑5.6 Sol — reasoning effort set to **Medium for planning** (breaking the requirements doc into phases/tasks) and **High for development** (actual implementation).

**How I used it:** Roughly half-and-half, with review throughout rather than accept-and-move-on.

- Me: ran the actual commands namely the Artisan generator batch (`make:model`, `make:request`, `make:resource`, `make:controller`, `make:test`, etc.) and did the initial implementation on top of those generated stubs.
- AI: took that initial implementation and finished it, continuing the logic I'd started in the controllers, form requests, resources, and migrations and wrote most of the backend (PHPUnit) and frontend (Vitest) test suites.
- Me: the UI/design layer. I'd originally instructed the AI to build the shadcn/ui components and page layout, but it didn't implement the design the way I wanted, so I built the frontend UI/UX myself by hand and had the AI write the corresponding tests against what I built.

**Roughly how much is AI vs. me:**

- About half. I ran the scaffolding and started the implementation; AI finished and continued that logic plus most of the test coverage. The actual UI implementation is mine.

**One thing the AI got wrong that I had to fix:**

1. **UI implementation.** Given the design instructions, the AI didn't produce a UI that matched what was asked for, so I implemented the components/layout myself instead of iterating further on its output.
2. **A test bug, not an app bug.** In the original JSON API implementation, two PHPUnit tests asserted a persisted date directly against SQLite's raw stored value (e.g. expected `2026-09-24`, got `2026-09-24 00:00:00`), even though the serialized responses were already correctly formatted as `YYYY-MM-DD`. Fixed by reading the persisted expense back through its Eloquent date cast and asserting with `toDateString()` instead of comparing the raw DB value.

**How I check AI output before shipping:** the full gate suite, each one checking something different:

- `composer test` (PHPUnit) — runs the backend feature tests to verify Inertia responses, redirects, validation, and persistence.
- `vendor/bin/pint` — enforces consistent PHP formatting.
- `npm run typecheck` — catches type errors the AI's TypeScript might have introduced.
- `npm run lint` — catches code-quality and React-hook issues.
- `npm test -- --run` — runs the frontend test suite.
- `npm run build` — confirms the production bundle actually compiles.

On top of all of that, I manually review every diff before accepting an AI-written change since the gates catch broken behavior, but not code that runs fine while doing the wrong thing.
