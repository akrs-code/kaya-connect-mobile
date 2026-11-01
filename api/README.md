# KayaConnect backend (NestJS)

```bash
npm install
cp .env.example .env      # fill in MONGODB_URI (Atlas, replica set) and a 32+ char JWT_ACCESS_SECRET
npm run seed              # categories + admin account from ADMIN_SEED_*
npm run start:dev         # API: http://localhost:5000/api/v1/health; Swagger: http://localhost:5000/docs
npm test                  # unit tests
npx jest tests/e2e        # e2e (downloads a MongoDB binary the first time)
npm run format            # format TypeScript source and tests
npm run format:check      # check formatting without changing files
```

Request pipeline: Throttler -> NoSqlGuard -> JwtAuthGuard (skip with @Public) -> RolesGuard (@Roles) -> ZodPipe -> controller -> service -> Mongoose.
Layout: `src/common` (guards, pipes, filters, decorators), `src/database` (schemas), `src/modules/<feature>` (module, controller, service, dto).

## API documentation

Swagger UI is available at `/docs` (for example, `http://localhost:5000/docs`), and the OpenAPI JSON document is available at `/docs-json`. The specification includes all registered API routes, grouped by feature. Protected routes use the `access-token` bearer scheme; obtain an access token from `POST /api/v1/auth/login` and use **Authorize** in Swagger UI. Health and category listing routes, along with registration, login, and token refresh, do not require authentication. Admin routes require an authenticated admin account.

## Opportunity discovery

The API supports published-opportunity browsing, keyword search, and filters through `GET /api/v1/opportunities`. Requesters can review applications through the applications endpoints. Rule-based recommendation endpoints have been retired: `GET /api/v1/recommendations/opportunities` and `GET /api/v1/opportunities/:id/recommended-providers` return 404. React Native clients should use browsing/search and application review instead.

This changes the documented product scope. Before claiming conformance with the supplied SRD, revise FR-013, FR-014, NFR-003, and their traceability entries to reflect that recommendations are out of scope.

## Admin moderation

All `/api/v1/admin/*` routes require the admin role. Users can report another user or a listing with a category and written reason. Moderators can review reports and their permitted target details, inspect users' listings, assignment statuses, and reviews, and manage account appeals. Private conversations and messages are not report targets and are never exposed to admins.

Moderation actions require a reason. Reports move from `open` to `under_review`, then to `resolved` or `dismissed`. Admins can suspend, deactivate, or reactivate user accounts. Suspension hides the public profile; reversible deactivation blocks login but leaves public profiles and listings visible. Users whose accounts are suspended or deactivated can submit an appeal through `POST /api/v1/users/me/account-appeal`; admins can review appeals and reinstate the account or uphold the restriction.

Admin data endpoints include `GET /api/v1/admin/users/:id/moderation`, `/opportunities`, `/assignments`, `/reviews`, and `/reports`. Restrict account and moderation views to the fields needed for platform enforcement; admin views do not expose email addresses, credentials, or private messages.
