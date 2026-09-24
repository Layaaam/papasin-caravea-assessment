# Expense Tracker Web Application Requirements

## 1. Document Purpose

This document defines the functional, technical, user-interface, validation, and quality requirements for the Expense Tracker technical assessment.

The application will provide a focused, production-quality expense CRUD experience using:

- Backend: Laravel 13 and PHP 8.5
- Database: PostgreSQL
- Frontend: React, TypeScript, and Vite
- Styling: Tailwind CSS 4
- Component library: Shadcn/ui
- Backend tests: PHPUnit
- Frontend tests: Vitest and React Testing Library

## 2. Current Codebase Assessment

The repository currently contains a largely unmodified Laravel application skeleton.

- Laravel 13.33.0, PHP 8.5.8, and PHPUnit 12.5 are installed.
- PostgreSQL is configured as the local database connection.
- Vite 8 and Tailwind CSS 4 are installed.
- Tailwind uses the correct CSS-first configuration with `@import 'tailwindcss'` and `@theme`.
- React, TypeScript, Shadcn/ui, frontend routing, ESLint, and frontend tests are not yet configured.
- Only the default web route and Laravel welcome page exist.
- API routing is not yet enabled.
- No expense model, migration, factory, seeder, controller, form request, API resource, service, page, component, or domain test exists.
- The existing PHPUnit tests are Laravel placeholder tests and do not cover the requested application.
- The default README has not yet been tailored to this project.

## 3. Product Goal

Build a responsive single-user web application that allows a user to create, find, review, update, and delete expense records through a React interface backed exclusively by a Laravel JSON API.

The implementation should demonstrate clear separation of concerns, robust validation, consistent API responses, accessible UI behavior, useful automated tests, and explicit verification reporting.

## 4. Scope

### 4.1 Included

- List expenses.
- View one expense.
- Create an expense.
- Update an expense.
- Delete an expense after confirmation.
- Search expenses by title.
- Filter expenses by category and expense-date range.
- Sort expenses by supported fields.
- Paginate expense results.
- Support predefined and user-entered custom categories.
- Display monetary values using the Philippine peso sign (`₱`).
- Handle loading, empty, success, validation, not-found, and unexpected-error states.
- Provide backend and frontend automated tests.

### 4.2 Excluded

- Authentication and user accounts
- Multi-user ownership or tenancy
- Budgets
- Income tracking
- Recurring expenses
- Receipt or file uploads
- Notifications
- Data import or export
- Currency conversion or multiple currencies
- Category administration outside the expense form
- Analytics dashboards or charts
- Deployment infrastructure

These exclusions must not be added unless the scope is explicitly changed.

## 5. Expense Data Model

The `expenses` table must contain the following columns:

| Column | Database type | Required | Rules and behavior |
| --- | --- | --- | --- |
| `id` | Big integer | Yes | Primary key |
| `title` | String | Yes | Trimmed; maximum 255 characters |
| `amount` | Decimal `(12,2)` | Yes | Greater than zero; at most two decimal places |
| `category` | String | Yes | Trimmed; maximum 100 characters |
| `expense_date` | Date | Yes | Valid calendar date; must not be later than the current application date |
| `notes` | Text, nullable | No | Trimmed when present; maximum 2,000 characters |
| `created_at` | Timestamp | Yes | Managed by Laravel |
| `updated_at` | Timestamp | Yes | Managed by Laravel |

Indexes should support the actual list queries. At minimum, filtering and default ordering by `expense_date` and filtering by `category` should be considered when defining indexes. Avoid speculative or redundant indexes.

The Eloquent model must:

- Explicitly define mass-assignable fields.
- Cast `amount` as a two-decimal value.
- Cast `expense_date` as a date.
- Avoid introducing relationships that do not exist in the requested domain.

## 6. Category Requirements

The expense form must provide these predefined categories:

- Food
- Transportation
- Housing
- Utilities
- Healthcare
- Entertainment
- Shopping
- Education
- Other

When `Other` is selected:

- A text field labeled `Category name` must become visible.
- The field must be required.
- Its value must be trimmed and validated using the same maximum length as `category`.
- The custom value, not the literal word `Other`, must be stored in the expense's `category` column.
- The feature must not create a separate category record or category-management workflow.

When editing an expense whose category is not one of the predefined categories:

- The form must select `Other` automatically.
- The `Category name` field must be visible and populated with the stored category.

The category filter should include predefined categories and distinct custom categories that exist in the returned filter data or current expense collection. Custom values must be treated safely as display text, not markup.

## 7. Functional Requirements

### 7.1 Expense List

The main screen must:

- Fetch expenses from the Laravel API through a frontend service module.
- Display title, amount, category, expense date, and available actions.
- Format amounts with `₱`, grouping separators, and exactly two decimal places.
- Format dates consistently in a human-readable form without changing the stored calendar date because of timezone conversion.
- Default to newest `expense_date` first, with descending `id` as a deterministic tie-breaker.
- Provide actions to view, edit, and delete each expense.
- Present an intentional empty state when no expenses exist.
- Present a distinct no-results state when active filters return no matches.
- Preserve usable controls while data is loading or a request fails.

### 7.2 Search and Filters

The list must support:

- Case-insensitive partial title search.
- Exact category filtering.
- Inclusive start-date filtering.
- Inclusive end-date filtering.
- A clear-all action that resets search, filters, sorting, and pagination to defaults.

Filter behavior must meet these rules:

- Filter state is sent as API query parameters; filtering must not rely only on the currently loaded page.
- An invalid date range, where the start date is later than the end date, must be rejected with a clear message.
- Changing a search or filter resets the current page to page 1.
- Input should be debounced where appropriate so title search does not generate a request for every rapid keystroke.

### 7.3 Sorting

The API and UI must support ascending and descending sorting for:

- `title`
- `amount`
- `category`
- `expense_date`

The server must map requested sort keys to an explicit allowlist. User input must never be inserted directly into a database ordering expression.

All sorts must include `id` as a deterministic tie-breaker.

### 7.4 Pagination

- The API must use server-side pagination.
- The default page size is 10 expenses.
- Supported page sizes are 10, 25, and 50.
- Unsupported page sizes must be rejected or normalized consistently.
- The UI must show the current result range, total records, current page, and available navigation.
- Changing the page size resets the current page to page 1.

### 7.5 View Expense

The user must be able to view all fields for one expense, including notes and timestamps where useful. A request for an unknown expense must produce a clear not-found state.

### 7.6 Create Expense

The create form must:

- Include all expense fields.
- Use the conditional custom-category behavior defined in Section 6.
- Apply useful client-side constraints for immediate feedback.
- Treat the Laravel API as the authoritative validation boundary.
- Display field-specific errors returned with a `422` response.
- Prevent accidental duplicate submissions while the request is pending.
- Add the newly created expense to the correct list state or refresh the list after success.
- Show a success notification and close or reset the form only after a successful API response.

### 7.7 Update Expense

The edit form must:

- Load the selected expense's current values.
- Follow the same validation and category behavior as creation.
- Prevent duplicate submissions while the update is pending.
- Reflect the saved values in the list or refresh the list after success.
- Keep the entered values available when validation fails.
- Show a success notification only after the API confirms the update.

### 7.8 Delete Expense

- Deletion must require an explicit confirmation dialog naming the expense.
- The confirmation action must be disabled while deletion is pending.
- Cancelling must not modify data.
- A successful deletion must remove the expense from the visible result or refresh the affected page.
- If deletion leaves a non-first page empty, the UI must navigate to the nearest valid page.
- API failures must leave the record visible and show an actionable error message.

## 8. Backend Architecture

The frontend must communicate with Laravel exclusively through the JSON API.

Every backend request must follow this flow:

`Route -> Controller -> Form Request -> Eloquent Model -> API Resource`

Required backend responsibilities:

- API routes use an `/api/v1` prefix.
- A resource controller provides `index`, `show`, `store`, `update`, and `destroy` actions.
- Route model binding resolves individual expenses.
- Store and update validation lives in dedicated Form Request classes.
- List-query validation should use a dedicated Form Request so filters, sorting, direction, page, and page size are validated before query construction.
- Controllers coordinate validated input, Eloquent operations, and API responses; they must not contain duplicated validation rules.
- Only validated and intended attributes may be passed to mass assignment.
- An API Resource defines the public expense representation.
- Reusable query constraints may be expressed as focused Eloquent scopes when they improve clarity.
- Additional action or service classes should only be introduced when real reusable business logic justifies them.
- JSON rendering must remain consistent for API and `Accept: application/json` requests.

No authentication middleware or ownership logic is required in this assessment.

## 9. API Contract

### 9.1 Endpoints

| Method | Endpoint | Purpose | Success status |
| --- | --- | --- | --- |
| `GET` | `/api/v1/expenses` | List, search, filter, sort, and paginate expenses | `200 OK` |
| `POST` | `/api/v1/expenses` | Create an expense | `201 Created` |
| `GET` | `/api/v1/expenses/{expense}` | Retrieve one expense | `200 OK` |
| `PUT/PATCH` | `/api/v1/expenses/{expense}` | Update an expense | `200 OK` |
| `DELETE` | `/api/v1/expenses/{expense}` | Delete an expense | `204 No Content` |

### 9.2 List Query Parameters

| Parameter | Accepted value |
| --- | --- |
| `search` | Optional title fragment, maximum 255 characters |
| `category` | Optional exact category value, maximum 100 characters |
| `date_from` | Optional date in `YYYY-MM-DD` format |
| `date_to` | Optional date in `YYYY-MM-DD` format; must be on or after `date_from` |
| `sort` | One of `title`, `amount`, `category`, or `expense_date` |
| `direction` | `asc` or `desc` |
| `page` | Positive integer |
| `per_page` | One of `10`, `25`, or `50` |

Default list behavior is `sort=expense_date`, `direction=desc`, `page=1`, and `per_page=10`.

### 9.3 Expense Representation

The API Resource must return a stable shape containing:

```json
{
  "id": 1,
  "title": "Team lunch",
  "amount": "1250.00",
  "category": "Food",
  "expense_date": "2026-09-24",
  "notes": "Client planning session",
  "created_at": "2026-09-24T08:00:00.000000Z",
  "updated_at": "2026-09-24T08:00:00.000000Z"
}
```

`amount` should be serialized as a fixed two-decimal string to avoid floating-point ambiguity. The frontend is responsible for `₱` display formatting.

Paginated list responses must retain Laravel pagination metadata and links through the API Resource collection.

### 9.4 Error Responses

- Invalid input returns `422 Unprocessable Entity` with field-specific errors.
- An unknown expense returns `404 Not Found`.
- Unsupported HTTP methods follow Laravel's standard response.
- Unexpected server errors return a generic JSON message without exposing stack traces or sensitive configuration outside development.
- Frontend code must not assume every error response has the success-response shape.

## 10. Frontend Architecture

Every frontend request must follow this flow:

`Page/Component -> Expense Service -> Laravel API`

The frontend must:

- Use React with strict TypeScript settings.
- Use `.tsx` for React components and `.ts` for non-visual modules.
- Define explicit request, response, pagination, filter, and validation-error types.
- Avoid TypeScript `any`.
- Centralize HTTP behavior in service modules rather than calling `fetch` or Axios throughout components.
- Keep page-level data orchestration separate from reusable presentation and form components.
- Keep components reasonably small and extract repeated UI patterns.
- Use React Router only if multiple client-side routes materially improve the implementation; a focused single-page CRUD interface may use dialogs or sheets instead.
- Avoid adding a state-management library unless the application develops state that cannot remain clear with React's built-in state and hooks.

Suggested frontend responsibilities:

- `ExpensePage`: owns list query state and request coordination.
- `ExpenseTable` or responsive expense list: renders results and actions.
- `ExpenseFilters`: controls search, filters, sorting, and reset behavior.
- `ExpenseForm`: shared create/update fields and validation presentation.
- `ExpenseDetails`: presents one complete expense.
- `DeleteExpenseDialog`: confirms destructive action.
- `expenseService`: owns API requests and response/error normalization.
- Expense TypeScript types: define domain and API contracts.

## 11. User Interface and Design Requirements

- Build the interface using Shadcn/ui components where they fit the interaction.
- Use Tailwind CSS 4 utilities and CSS-first theme tokens; do not introduce a Tailwind v3 configuration pattern.
- Use semantic, consistent spacing and prefer `gap` utilities for sibling layout.
- Provide a clear visual hierarchy with a page title, primary create action, filters, result content, and pagination.
- Use a table on wider screens and preserve readability on narrow screens through horizontal containment or an appropriate mobile list treatment.
- The application must be usable at common mobile, tablet, and desktop widths.
- Clearly distinguish primary, secondary, and destructive actions.
- Use skeletons or concise loading indicators without causing major layout shifts.
- Use toasts or inline alerts for operation-level success and failure feedback.
- Do not rely on color alone to communicate status or validation.
- Dark mode is optional because no established application-level dark-mode behavior currently exists. If introduced, it must be complete and consistent rather than partially applied.

Recommended Shadcn/ui primitives include Button, Input, Textarea, Select, Card, Table, Dialog or Alert Dialog, Sheet or Dialog for forms/details, Badge, Skeleton, and Toast/Sonner.

## 12. Accessibility Requirements

- All form fields must have programmatically associated labels.
- Required fields and validation messages must be announced accessibly.
- Dialogs must have accessible titles/descriptions, trap focus, and restore focus when closed.
- All functionality must be keyboard operable.
- Icon-only actions must have accessible names.
- Focus indicators must remain visible.
- Destructive confirmation must clearly identify the affected expense.
- Loading states should use an appropriate busy indication.
- Text and controls must maintain readable contrast.

## 13. Security and Data Integrity

- Validate every client-controlled field and query parameter on the server.
- Restrict mass assignment to the five permitted expense fields.
- Allowlist sort columns and directions.
- Render titles, notes, and custom categories as text so user content cannot inject markup.
- Use Eloquent and parameterized query behavior; do not concatenate input into raw SQL.
- Do not expose environment values, database credentials, or exception details to the frontend.
- Use decimal database storage and string-based API serialization for money; do not use binary floating-point storage for `amount`.
- Treat client-side validation as usability only; it must never replace server validation.

## 14. Automated Testing Requirements

### 14.1 Backend Tests

Use PHPUnit feature tests as the primary backend coverage. Tests that access the database should use Laravel database refresh support and the expense factory.

Coverage must include:

- List endpoint response shape and deterministic default ordering.
- Pagination metadata and supported page sizes.
- Title search.
- Category filtering, including a custom category.
- Inclusive start-date and end-date filters.
- Supported sorts and directions.
- Rejection of invalid filters, date ranges, sort keys, directions, pages, and page sizes.
- Prevention of dynamic sort/query injection.
- Retrieval of an existing expense and `404` for a missing expense.
- Successful creation with every field and with nullable notes.
- Successful creation using a custom category value.
- Successful update, including switching between predefined and custom category values.
- Successful deletion and confirmation that the database record is absent.
- Required-field validation.
- Title, category, and notes length boundaries.
- Amount boundaries, positivity, numeric format, and decimal precision.
- Rejection of future expense dates.
- Rejection of unexpected payload keys as persisted model attributes.
- Stable API Resource field names and money/date serialization.

Tests must assert observable behavior. Write operations must assert both the response and the resulting database state. Date-dependent tests must freeze the application date.

### 14.2 Frontend Tests

Configure Vitest, React Testing Library, `jest-dom`, and a browser-like test environment compatible with the installed Vite version.

Coverage must include:

- Expense-service query serialization and success/error normalization.
- Loading, populated, empty, no-results, and request-error list states.
- Peso formatting with exactly two decimal places.
- Form rendering and population for create and edit modes.
- `Other` revealing a required custom-category field.
- Editing a custom category selecting `Other` and restoring its stored value.
- Field-level Laravel validation errors.
- Submit controls being disabled while a request is pending.
- Successful create and update behavior.
- Delete confirmation, cancellation, success, and failure behavior.
- Search/filter reset and page-reset behavior.
- Keyboard-accessible names for important controls.

Tests should mock the service boundary or network calls deterministically and must not depend on a running external server.

## 15. Quality Gates

The implementation is complete only when all relevant gates pass.

### Backend

- Run the narrowest relevant test file or filter during development.
- Run `vendor/bin/pint --dirty --format agent` after modifying PHP files.
- Run the completed backend test suite with `composer test` or the corresponding complete PHPUnit command.

### Frontend

The project must define scripts for these gates:

- Type checking, such as `npm run typecheck`.
- ESLint, such as `npm run lint`.
- Frontend tests in non-watch mode, such as `npm test -- --run` or an equivalent configured script.
- Production compilation with `npm run build`.

Do not claim a gate passed unless its command was actually run successfully.

### Verification Reporting

Every implementation handoff or test report must state:

1. Each command that was run.
2. Whether it passed or failed.
3. A concise description of failures and any corrective action.
4. Every relevant command that was not run, explicitly marked `Not run`, with the reason.

Required reporting example:

```text
Verification
- PASS: php artisan test --compact tests/Feature/Api/ExpenseControllerTest.php
- PASS: vendor/bin/pint --dirty --format agent
- PASS: npm run typecheck
- PASS: npm run lint
- PASS: npm test -- --run
- PASS: npm run build
- NOT RUN: composer test — omitted only if a documented blocker prevented it
```

If a required script has not been configured or a tool is unavailable, report that limitation. Do not substitute an invented command or describe unexecuted checks as passing.

## 16. Implementation Plan

### Phase 1: Frontend and API Foundation

- Install and configure React, TypeScript, the Vite React plugin, Shadcn/ui, ESLint, Vitest, and React Testing Library dependencies compatible with the existing toolchain.
- Convert the frontend entry point to TypeScript/React.
- Configure strict TypeScript, linting, frontend test scripts, and the test environment.
- Replace the default welcome page with a minimal Blade shell that mounts the React application.
- Enable versioned API routing.

### Phase 2: Expense Persistence and API

- Generate the expense model, migration, factory, and seeder using Artisan.
- Implement casts, fillable attributes, and representative factory data.
- Generate Form Requests, API Resource, controller, and API feature tests.
- Implement CRUD endpoints, validation, filtering, allowlisted sorting, deterministic ordering, and pagination.
- Verify API behavior and format PHP changes.

### Phase 3: Frontend Service and Core UI

- Define expense and API TypeScript types.
- Implement the centralized expense service.
- Build the responsive application layout and expense list.
- Implement loading, empty, no-results, and error states.
- Add search, filters, sorting, pagination, and peso/date formatting.

### Phase 4: CRUD Interactions

- Build the shared create/edit form.
- Implement predefined and custom category behavior.
- Display Laravel validation errors.
- Add expense details and delete confirmation.
- Add success and failure notifications.

### Phase 5: Frontend Tests and Final Verification

- Add meaningful component and service tests.
- Run the focused test commands while iterating.
- Run Pint, the full backend suite, TypeScript checking, ESLint, frontend tests, and the production build.
- Report every run and every omitted gate using Section 15.
- Review the final application against all acceptance criteria and remove the Laravel placeholder tests or replace them with meaningful project coverage.

## 17. Acceptance Criteria

The assessment is accepted when:

- All five expense CRUD operations work through the React interface and versioned Laravel API.
- The backend follows the required Route -> Controller -> Form Request -> Eloquent Model -> API Resource flow.
- The frontend follows the required Page/Component -> Service -> Laravel API flow.
- All five expense fields persist and serialize correctly.
- Amounts use decimal-safe storage and display with `₱` and two decimal places.
- Future expense dates are rejected by the server and explained in the UI.
- Selecting `Other` requires a custom category name, stores that name directly, and restores it correctly during editing.
- Search, category/date filters, sorting, reset behavior, and server-side pagination work together.
- Loading, empty, no-results, success, validation, not-found, and unexpected-error states are handled.
- The UI is responsive, keyboard accessible, and built with Tailwind CSS 4 and appropriate Shadcn/ui components.
- Dynamic query inputs are allowlisted and free-text values are rendered safely.
- Backend and frontend automated tests cover the behaviors described in Section 14.
- PHP formatting, backend tests, TypeScript checks, ESLint, frontend tests, and the production build pass, or any unrun/failed gate is explicitly disclosed.

## 18. Assumptions and Decisions

- The application is a single-user assessment and requires no authentication.
- All expenses use Philippine pesos; the database does not store a currency column.
- `Other` stores a custom string on the expense and does not create a reusable category entity.
- The current application timezone governs whether an expense date is in the future. The timezone should be configured deliberately for the intended Philippine context before release.
- Filtering, sorting, and pagination occur on the server.
- Laravel remains the host application for the React/Vite build; a separate frontend repository or server is unnecessary.
- Dependencies should be limited to those required by the approved technology stack, accessible UI components, linting, and automated testing.
