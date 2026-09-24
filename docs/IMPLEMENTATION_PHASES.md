# Expense Tracker Implementation Phases

This document records the implementation plan, the purpose of each phase, the commands run by the developer, the work completed, and the verification status. The backend JSON API is complete through Phase 2. A React frontend that communicates with that API is planned for later phases; it has not been built. Inertia is not part of the agreed architecture.

The "Current Codebase Assessment" and phase outline in `REQUIREMENTS.md` describe the original assessment baseline. The status and implementation record below describe what has happened since that baseline.

## Status Summary

| Phase | Area                                    | Status      |
| ----- | --------------------------------------- | ----------- |
| 1     | Backend scaffold and API implementation | Finished    |
| 2     | Backend verification                    | Finished    |
| 3     | Frontend foundation                     | Finished    |
| 4     | Frontend components                     | Not started |
| 5     | React-to-Laravel connection             | Not started |
| 6     | Cleanup and final verification          | Not started |

## Phase 1 — Backend Scaffold and API

**Status: Finished**

### Commands run by the developer

The developer ran the approved Artisan generator batch on September 24, 2026:

```powershell
php artisan make:model Expense --migration --factory --seed --no-interaction
php artisan make:request Api/V1/ListExpenseRequest --no-interaction
php artisan make:request Api/V1/StoreExpenseRequest --no-interaction
php artisan make:request Api/V1/UpdateExpenseRequest --no-interaction
php artisan make:resource Api/V1/ExpenseResource --no-interaction
php artisan make:controller Api/V1/ExpenseController --api --model=Expense --no-interaction
php artisan make:test --phpunit Api/V1/ExpenseIndexTest --no-interaction
php artisan make:test --phpunit Api/V1/ExpenseShowTest --no-interaction
php artisan make:test --phpunit Api/V1/ExpenseStoreTest --no-interaction
php artisan make:test --phpunit Api/V1/ExpenseUpdateTest --no-interaction
php artisan make:test --phpunit Api/V1/ExpenseDestroyTest --no-interaction
```

All requested files were reported as created successfully.

### Generated artifacts and why they are relevant

| Artifact                                          | Purpose                                                                                              | Relevance to the assessment                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `app/Models/Expense.php`                          | Represents an expense and owns its casts, allowed mass-assignment fields, and reusable query scopes. | Establishes the required Eloquent model boundary without relationships or unrelated domain logic.             |
| `database/migrations/*_create_expenses_table.php` | Defines the durable PostgreSQL-compatible expense schema and query-supporting indexes.               | Enforces decimal money storage, nullable notes, dates, timestamps, and indexes for the required list queries. |
| `database/factories/ExpenseFactory.php`           | Produces representative expense records.                                                             | Gives database feature tests isolated, readable test data and supports local sample data.                     |
| `database/seeders/ExpenseSeeder.php`              | Creates a small sample expense collection.                                                           | Makes local manual review practical without introducing production behavior or unrelated entities.            |
| `ListExpenseRequest`                              | Validates and normalizes search, filters, sorting, direction, page, and page size.                   | Prevents invalid query construction and dynamic sort injection before the controller runs.                    |
| `StoreExpenseRequest`                             | Normalizes and validates new expense input.                                                          | Keeps authoritative validation outside the controller and restricts writes to the documented fields.          |
| `UpdateExpenseRequest`                            | Applies the same authoritative contract to updates.                                                  | Ensures edits cannot bypass field, money, date, or length constraints.                                        |
| `ExpenseResource`                                 | Defines the public JSON representation of an expense.                                                | Stabilizes field names and serializes money as a two-decimal string and dates without timezone shifts.        |
| `ExpenseController`                               | Coordinates validated requests, Eloquent operations, pagination, and resource responses.             | Implements the required Route → Controller → Form Request → Model → API Resource flow.                        |
| Five action-focused PHPUnit test classes          | Exercise index, show, store, update, and destroy behavior.                                           | Covers observable API behavior while keeping failures associated with a specific CRUD action.                 |

### Work completed

- Added the `expenses` schema with `title`, `decimal(12,2)` amount, category, expense date, nullable notes, timestamps, and focused composite indexes.
- Restricted mass assignment to the five approved expense fields and added decimal/date casts.
- Added reusable Eloquent scopes for case-insensitive title search, exact category filtering, and inclusive date boundaries.
- Added trimming and validation for write payloads, including positive amounts, at most two decimal places, database precision limits, non-future dates, and documented text lengths.
- Added list-query validation for supported filters, dates, sort keys, directions, page numbers, and page sizes.
- Implemented deterministic sorting using `id` as the tie-breaker in the requested direction.
- Implemented Laravel server-side pagination with query-string-preserving links.
- Added distinct stored categories to list metadata so custom categories remain available to the frontend filter.
- Implemented `201`, `200`, `204`, `404`, and `422` API behavior using route model binding and standard Laravel JSON rendering.
- Added public `/api/v1/expenses` resource routes without Sanctum or authentication middleware.
- Configured `Asia/Manila` as the default application timezone through `APP_TIMEZONE`.
- Updated the main database seeder to seed expenses instead of an unrelated default user.
- Added feature-test coverage for serialization, default ordering, pagination, search, filtering, sorting, validation, injection attempts, custom categories, unexpected payload keys, persistence, missing records, and deletion.

### Implemented API contract and decisions

- `GET /api/v1/expenses` lists expenses; `POST /api/v1/expenses` creates one; `GET /api/v1/expenses/{expense}` shows one; `PUT/PATCH /api/v1/expenses/{expense}` updates one; and `DELETE /api/v1/expenses/{expense}` removes one. Route model binding handles missing expenses. The routes were registered through `bootstrap/app.php` and `routes/api.php` without installing Sanctum.
- The list defaults to `sort=expense_date`, `direction=desc`, `page=1`, and `per_page=10`. It accepts page sizes 10, 25, and 50, and sorting by `title`, `amount`, `category`, or `expense_date` in either direction. Every ordering adds `id` in the same direction as a deterministic tie-breaker; sort keys and directions are validated before query construction.
- Search is a case-insensitive partial title match. Category matching is exact, date bounds are inclusive, and an invalid date range receives a field-specific `422` response. Paginated responses retain Laravel's links and metadata and add distinct stored categories under `meta.categories` for the future frontend filter.
- The expense resource returns the five domain fields plus `id`, `created_at`, and `updated_at`. Amounts are fixed two-decimal strings and `expense_date` is `YYYY-MM-DD`. Successful create returns `201`, reads and updates return `200`, and delete returns `204`.
- `config/app.php` reads `APP_TIMEZONE`, defaulting to `Asia/Manila`; `.env.example` documents that value. This sets the application date used by non-future expense-date validation unless an environment override is supplied.
- `ExpenseSeeder` was implemented and registered with `DatabaseSeeder` to create sample expenses. No seeder execution was reported, so sample data creation has not been verified.

### Verification status

These entries describe the Phase 1 handoff. The migration, formatting, and backend tests were subsequently run during Phase 2, with final results recorded below.

- Generator output: **PASS** — all Phase 1 scaffold files were created successfully according to the supplied console output.
- Backend test execution: **NOT RUN** — reserved for the Phase 2 developer-run verification checkpoint.
- Pint formatting: **NOT RUN** — reserved for Phase 2 so formatting and tests are verified together.
- Local PostgreSQL migration: **NOT RUN** — reserved for Phase 2 and requires the configured local database.

## Phase 2 — Backend Verification

**Status: Finished**

### Developer command checkpoint

The developer ran the approved verification batch. The migration against the configured local PostgreSQL connection, API route listing, and Pint passed. The focused API suite reported 2 failures among 52 tests; `composer test` reported the same 2 failures among 54 tests. PHPUnit's database tests used the configured in-memory SQLite connection.

Both failures came from the create and update tests comparing a date-only string directly to SQLite's raw stored value. For example, the create assertion expected `2026-09-24`, while SQLite returned `2026-09-24 00:00:00`; the update assertion had the same mismatch for `2026-09-23`. The API response checks already passed with the required `YYYY-MM-DD` values. These were test assertion mismatches, not failed API requests or incorrect response data.

### Correction

The two tests still assert the saved non-date fields against the database. They now read the persisted expense through its Eloquent date cast and assert its calendar date with `toDateString()`. This verifies the saved calendar date in the SQLite test environment. The PostgreSQL migration passed, but the expense API tests were not run against PostgreSQL, so equivalent API behavior on that connection has not been independently verified.

### Verification results after correction

| Command                                                                 | Result                          | Purpose                                                                  |
| ----------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `php artisan migrate --no-interaction` (developer)                      | PASS                            | Created the `expenses` table on the configured local database.           |
| `php artisan route:list --path=api/v1 --except-vendor` (developer)      | PASS                            | Confirmed all five versioned expense resource routes.                    |
| `php artisan test --compact tests/Feature/Api/V1/ExpenseStoreTest.php`  | PASS — 18 tests                 | Rechecked creation and validation after editing its test.                |
| `php artisan test --compact tests/Feature/Api/V1/ExpenseUpdateTest.php` | PASS — 5 tests                  | Rechecked update and validation after editing its test.                  |
| `php vendor/bin/pint --dirty --format agent`                            | PASS                            | Formatted the changed PHP tests.                                         |
| `php artisan test --compact tests/Feature/Api/V1`                       | PASS — 52 tests, 214 assertions | Rechecked the complete expense API feature suite.                        |
| `composer test`                                                         | PASS — 54 tests, 216 assertions | Rechecked the complete backend suite, including existing skeleton tests. |

The developer's initial failed test runs are retained above for the audit trail; the corrected runs passed. The default PHPUnit placeholder tests and Laravel welcome page remain until the planned Phase 6 cleanup. Frontend checks were not run because the frontend has not been implemented.

## Phase 3 — Frontend Foundation

**Status: Finished**

### Commands run by the developer

The developer installed the approved frontend foundation dependencies:

```powershell
npm install react react-dom clsx tailwind-merge
npm install --save-dev @vitejs/plugin-react typescript @types/node @types/react @types/react-dom eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals vitest jsdom @testing-library/dom @testing-library/react @testing-library/jest-dom
```

Both installs passed, audited 274 packages in the final dependency tree, and reported no vulnerabilities.

### Work completed

- Added React 19 and converted the active Vite entry point to `resources/js/app.tsx` with a guarded React root and strict-mode rendering.
- Added a minimal `App` shell and a dedicated Blade host view. The root web route now renders that host without adding client-side routing or expense functionality ahead of later phases.
- Added strict TypeScript 6 configuration, including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, DOM libraries, and the `@/*` alias for `resources/js/*`.
- Converted the Vite configuration to TypeScript and configured the React plugin, Laravel plugin, Tailwind CSS 4 plugin, source alias, jsdom test environment, and Testing Library setup file.
- Added ESLint flat configuration with type-aware TypeScript rules, React Hooks rules, and React Refresh rules.
- Added non-watch test, watch test, lint, and type-check scripts to `package.json`.
- Added Shadcn CLI configuration for TypeScript, Tailwind CSS 4, CSS variables, and the project aliases, plus the shared `cn` utility. No Shadcn primitives were generated; those remain Phase 4 work.
- Preserved the CSS-first Tailwind 4 configuration and explicitly registered the React TypeScript source files.
- Added one focused React smoke test proving that the application shell renders in the configured jsdom environment.
- Retained the replaced `resources/js/app.js` entry point and `resources/views/welcome.blade.php` for the approved Phase 6 cleanup.

### Verification and correction

The first type-check run failed because TypeScript 6 deprecates `baseUrl` and reports it as `TS5101`. The alias already used a project-relative `paths` target, so `baseUrl` was removed rather than suppressing the deprecation. The first production build passed but warned that optimized font fallbacks require the optional `fontaine` package; optimized fallbacks were disabled because the package is unnecessary for this assessment. The complete frontend gate batch then passed without warnings.

| Command | Result | Purpose |
| --- | --- | --- |
| `npm run typecheck` (initial) | FAIL — `TS5101` | Detected the deprecated TypeScript 6 `baseUrl` option. |
| `npm run lint` (initial) | PASS | Verified the ESLint flat configuration and frontend source. |
| `npm test` (initial) | PASS — 1 test | Verified the React shell and jsdom/Testing Library setup. |
| `npm run build` (initial) | PASS with optional-font warning | Verified production compilation before removing the avoidable warning. |
| `php artisan test --compact tests/Feature/ExampleTest.php` | PASS — 1 test, 1 assertion | Verified that the root Laravel route still renders successfully. |
| `php vendor/bin/pint --dirty --format agent` | PASS | Formatted the changed PHP route file. |
| `npm run typecheck` (corrected) | PASS | Verified strict TypeScript after removing `baseUrl`. |
| `npm run lint` (corrected) | PASS | Rechecked linting against the corrected configuration. |
| `npm test` (corrected) | PASS — 1 test | Rechecked the React test environment after the configuration correction. |
| `npm run build` (corrected) | PASS | Built the production assets without the earlier font warning. |
| `git diff --check` | PASS | Confirmed the completed Phase 3 diff contains no whitespace errors. |
| `composer test` | NOT RUN | The expense API was unchanged; the focused root-route test passed, and the complete backend suite remains a Phase 6 gate. |

## Phase 4 — Frontend Components

**Status: Not started**

Generate the approved Shadcn primitives and build the expense page, filters, responsive results, pagination, shared form, details dialog, delete confirmation, formatters, and mocked component tests.

## Phase 5 — React-to-Laravel Connection

**Status: Not started**

Implement the typed expense service and connect all list and CRUD interactions to `/api/v1/expenses`, including normalized errors, debounced search, page correction after deletion, and server-validation feedback.

## Phase 6 — Cleanup and Final Verification

1.  **Status: Not started**

Remove only the approved replaced entrypoints, welcome view, placeholder tests, and any resulting empty test directory. Run every backend and frontend quality gate and record each result as `PASS`, `FAIL`, or `NOT RUN`.
