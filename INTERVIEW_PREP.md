# Interview Preparation Guide (Viva)

This document contains 40 rigorous technical questions, model answers, follow-ups, and advanced discussion points to prepare for a Senior Staff-level technical review.

## Authentication, Authorization & Security

**Q1: How is authentication implemented in this application?**
- **Model Answer:** We use JSON Web Tokens (JWT). The `/auth/login` endpoint issues a signed token containing the `userId`. Subsequent requests must include this token in the `Authorization: Bearer <token>` header. The `authenticateJWT` middleware verifies the signature using `process.env.JWT_SECRET`.
- **Follow-Up:** What happens if the JWT secret is compromised?
- **Advanced Discussion Point:** Strategies for token rotation, short-lived access tokens combined with HttpOnly refresh tokens, and token revocation lists (blocklists).

**Q2: How does the system handle authorization for specific groups?**
- **Model Answer:** We use group-level authorization rather than global roles. When a request hits `/groups/:groupId/*`, the `authorizeGroupAdmin` middleware checks the `GroupMember` table to ensure the `userId` from the JWT has `isAdmin === true` for that specific `groupId`.
- **Follow-Up:** How do you optimize this check so it doesn't crush the database on every request?
- **Advanced Discussion Point:** Implementing Redis caching for user permissions or encoding a short-lived group role directly inside the JWT payload.

**Q3: Why was Multer placed after the authentication middleware?**
- **Model Answer:** If `upload.single('file')` runs before `authenticateJWT`, an unauthenticated attacker could repeatedly send 10MB payloads, forcing the server to parse and buffer them, leading to an application-level DDoS (memory exhaustion).
- **Follow-Up:** Are there other limits applied to Multer?
- **Advanced Discussion Point:** Yes, `limits: { fileSize: 10 * 1024 * 1024 }` enforces a hard limit. We also use a `fileFilter` to reject non-CSV MIME types.

**Q4: How are passwords stored?**
- **Model Answer:** Passwords are never stored in plaintext. They are hashed using a robust algorithm (like bcrypt or argon2) during the `/auth/register` flow, and the resulting string is stored in the `passwordHash` column.
- **Follow-Up:** Why is a salt necessary?
- **Advanced Discussion Point:** Salting defends against rainbow table attacks by ensuring identical passwords yield different hashes.

**Q5: What protections exist against CSV injection?**
- **Model Answer:** We do not execute or render the raw CSV data as HTML/JS on the backend. The frontend is responsible for escaping data when rendering React/Vue components to prevent XSS.
- **Follow-Up:** What if the CSV contains executable macros like `=cmd|' /C calc'!A0`?
- **Advanced Discussion Point:** While harmless to our Postgres database, if we export this CSV back to Excel, it could execute. We should sanitize fields starting with `=`, `+`, `-`, or `@`.

## Express & Middleware

**Q6: What is the purpose of `mergeParams: true` in your Express Routers?**
- **Model Answer:** Because we nest routers (e.g., `router.use('/:groupId/expenses', expensesRoutes)`), the inner `expensesRoutes` needs access to the `:groupId` parameter from the parent router. `mergeParams: true` allows this.
- **Follow-Up:** What happens if you forget it?
- **Advanced Discussion Point:** `req.params.groupId` will be `undefined`, causing Prisma queries to fail or return 400 Bad Request if validated by Zod.

**Q7: How is request validation handled?**
- **Model Answer:** We use a generic `validateRequest` middleware combined with Zod schemas. The middleware runs `schema.parse(req.body)` and catches `ZodError`s, returning a structured 400 response before the controller runs.
- **Follow-Up:** Why do this in middleware instead of the controller?
- **Advanced Discussion Point:** Separation of concerns. Controllers should only contain business logic orchestration, assuming the input is already sanitized and strongly typed.

**Q8: Explain the Express error handling pipeline.**
- **Model Answer:** Express catches synchronous errors automatically, but asynchronous errors inside controllers must be passed to `next(err)` or handled via an `express-async-errors` wrapper. A global error handler middleware sits at the end of the chain to catch these and format standard 500 responses.
- **Follow-Up:** How do you differentiate between operational errors and programmer errors?
- **Advanced Discussion Point:** Operational errors (e.g., "User not found") should have specific HTTP status codes (404). Programmer errors (e.g., null pointer exceptions) should log a stack trace and return a generic 500.

**Q9: Why use classes for Controllers and Services?**
- **Model Answer:** It enables dependency injection and easier unit testing. A controller instance can be injected with a mock service during testing.
- **Follow-Up:** Are the controllers singletons?
- **Advanced Discussion Point:** Yes, in our current `routes.ts` files, we instantiate them once (`const controller = new Controller()`). Therefore, they must be completely stateless.

**Q10: What is the benefit of splitting routes from controllers?**
- **Model Answer:** Routes define the HTTP contract (methods, paths, middleware). Controllers map HTTP requests to business logic. This allows us to keep the router files clean and easy to audit.
- **Follow-Up:** How would you version the API?
- **Advanced Discussion Point:** By prefixing the router mounts in `app.ts` (e.g., `app.use('/v1/groups', groupsRoutes)`).

## Prisma, PostgreSQL & Transactions

**Q11: Why choose Prisma over raw SQL or TypeORM?**
- **Model Answer:** Prisma provides superior type safety out-of-the-box. The generated Prisma Client exactly matches our schema, catching database mismatches at compile time rather than runtime.
- **Follow-Up:** What is a downside of Prisma?
- **Advanced Discussion Point:** Prisma's Rust-based query engine adds overhead, and complex analytical queries (like recursive CTEs) are difficult to express without dropping into raw SQL.

**Q12: How do you handle cascade deletes?**
- **Model Answer:** We configure referential actions in the `schema.prisma`. For example, deleting a `Group` triggers `onDelete: Cascade` for `GroupMember` and `Expense`. However, `Expense.paidById` uses `onDelete: Restrict` to prevent deleting users who have financial history.
- **Follow-Up:** What happens if an Admin tries to delete a user with `Restrict`?
- **Advanced Discussion Point:** The database throws a foreign key constraint violation. Prisma catches this and surfaces an error. We handle this by returning a 409 Conflict.

**Q13: Explain how the `finalizeImport` transaction works.**
- **Model Answer:** We use Prisma's `$transaction(async (tx) => { ... })`. We pass the `tx` object into our service methods instead of using the global `prisma` client. If any statement inside the block throws an error, Postgres issues a `ROLLBACK`.
- **Follow-Up:** Why do we lock the job status to `FINALIZING` *before* the transaction?
- **Advanced Discussion Point:** To prevent distributed race conditions. If two admins click "Finalize" simultaneously, the first query `UPDATE ... WHERE status != FINALIZING` will succeed for one and return `count: 0` for the other, safely aborting the duplicate request.

**Q14: How does PostgreSQL handle the `Decimal` type used for amounts?**
- **Model Answer:** Prisma maps `Decimal` to Postgres `DECIMAL` or `NUMERIC`, which performs exact arbitrary-precision arithmetic, preventing the floating-point rounding errors typical of IEEE 754 floats.
- **Follow-Up:** How do you handle this precision in Node.js?
- **Advanced Discussion Point:** Prisma returns them as `Decimal.js` objects. We must be careful not to cast them natively to JavaScript `Number` prematurely if we are doing complex fractional math.

**Q15: What indexes are configured, and why?**
- **Model Answer:** We added `@@index([groupId, date])` on the `Expense` table because the primary query pattern is fetching a group's expenses sorted by date. We also indexed `[groupId, joinedAt, leftAt]` on `GroupMember` for temporal queries.
- **Follow-Up:** How do you verify an index is actually being used?
- **Advanced Discussion Point:** By using Postgres `EXPLAIN ANALYZE` to check if the query planner executes an Index Scan versus a Sequential Scan.

## Architecture & Scalability

**Q16: Is the application stateless?**
- **Model Answer:** Yes. It stores no session state in memory. JWTs are stateless, and file uploads via Multer are buffered entirely in memory for the duration of the request before being parsed and discarded.
- **Follow-Up:** Why is statelessness important for deployment?
- **Advanced Discussion Point:** It allows us to seamlessly horizontally scale the Node.js instances across multiple servers or containers behind a load balancer without sticky sessions.

**Q17: How would you scale the CSV import process for files with 1,000,000 rows?**
- **Model Answer:** We would change Multer to save to disk or S3 instead of memory. We would stream the file using `fs.createReadStream` piped to `csv-parser`, inserting rows into Postgres in batches (e.g., 1,000 at a time) using a background worker (like BullMQ).
- **Follow-Up:** How does the user know when it finishes?
- **Advanced Discussion Point:** We would implement WebSockets or Server-Sent Events (SSE) to push progress updates, or require the client to poll the `GET /imports/:id` endpoint.

**Q18: What is the purpose of DTOs (Data Transfer Objects)?**
- **Model Answer:** DTOs define the shape of data entering and leaving the API. They decouple the API contract from the internal database schema.
- **Follow-Up:** What tool do we use for this?
- **Advanced Discussion Point:** We use Zod to validate the payload and infer TypeScript types that act as our DTOs.

**Q19: How do you handle database connection pooling?**
- **Model Answer:** Prisma manages its own connection pool. The size is configured via the `DATABASE_URL` query parameter (e.g., `?connection_limit=10`).
- **Follow-Up:** What happens if the pool is exhausted?
- **Advanced Discussion Point:** Requests will queue up and eventually time out. To scale horizontally with serverless functions, we would need an external pooler like PgBouncer or Prisma Accelerate.

**Q20: Why separate the `Expense` and `ExpenseParticipant` tables?**
- **Model Answer:** Normalization. An expense can be split among an arbitrary number of users. A 1-to-many relationship handles this cleanly and allows us to store user-specific `computedOweAmount`s.
- **Follow-Up:** Why not store participants as a JSON array column?
- **Advanced Discussion Point:** JSON arrays cannot enforce foreign key constraints (meaning a user could be deleted while still owing money) and make querying "All expenses User A is part of" extremely slow.

## Imports & CSV Parsing

**Q21: Why does `csv-parser` require header normalization?**
- **Model Answer:** Real-world CSVs have inconsistent headers ("Paid By", "paid_by ", "Paid_By"). We normalize them by stripping spaces and forcing lowercase so our business logic can reliably access keys.
- **Follow-Up:** What happens if a required column is entirely missing from the file?
- **Advanced Discussion Point:** The anomaly engine flags every row with `MISSING_PAYER` or similar. We could optimize this by validating the headers *before* parsing the rows to fail fast.

**Q22: Why store `rawData` and `normalizedData` in the `ImportRow`?**
- **Model Answer:** `rawData` preserves exactly what the user uploaded for auditing purposes. `normalizedData` is the working copy that gets mutated by resolution actions (e.g., correcting a date).
- **Follow-Up:** How are they typed in Prisma?
- **Advanced Discussion Point:** They use the `Json` scalar type, which maps to `JSONB` in Postgres, allowing fast structured storage and querying.

**Q23: How does the system resolve ambiguous dates (e.g., 04/05/2026)?**
- **Model Answer:** The anomaly engine flags dates containing slashes as `AMBIGUOUS_DATE`. The admin must review it to confirm whether it is April 5th or May 4th.
- **Follow-Up:** Can we automate this?
- **Advanced Discussion Point:** We could require users to provide a timezone/locale context during upload, or enforce ISO 8601 strict parsing.

**Q24: What is the lifecycle of an `ImportJob`?**
- **Model Answer:** `PENDING_REVIEW` (when uploaded and anomalies are found) -> `READY_TO_IMPORT` (when all anomalies are resolved) -> `FINALIZING` (when transaction begins) -> `COMPLETED` (or `FAILED` if transaction rolls back).
- **Follow-Up:** Can a job go from `READY_TO_IMPORT` back to `PENDING_REVIEW`?
- **Advanced Discussion Point:** No, state transitions should be strictly forward. Once an anomaly is resolved, it shouldn't be "un-resolved" unless we implement a specific rollback feature.

**Q25: Why ignore entire rows if one anomaly is rejected?**
- **Model Answer:** A row represents a single atomic financial transaction. If one part of it (e.g., the payer) is fundamentally invalid and rejected, the rest of the data cannot be trusted.
- **Follow-Up:** Could we allow partial imports of a row?
- **Advanced Discussion Point:** No, a partial expense makes no logical sense.

## Anomaly Detection Workflow

**Q26: Explain the `MEMBERSHIP_VIOLATION` logic.**
- **Model Answer:** The engine parses the expense `date` and queries the `GroupMember` table for the payer. If `joinedAt > date` or `leftAt < date`, the user was not active when the expense occurred, triggering the anomaly.
- **Follow-Up:** What if the user joined on the exact same day?
- **Advanced Discussion Point:** Timezones matter. We compare timestamps. If `joinedAt` is 14:00 UTC and the expense is 10:00 UTC, it's technically a violation, though we might want to round to the day level for user friendliness.

**Q27: How do you differentiate `EXACT_DUPLICATE` from `CONFLICTING_DUPLICATE`?**
- **Model Answer:** We query existing expenses matching the description, date, and payer. If the `amount` also matches exactly, it's an `EXACT_DUPLICATE`. If the amount differs, it's a `CONFLICTING_DUPLICATE` (someone likely re-entered the receipt with a different total).
- **Follow-Up:** Why is conflicting duplicate a higher severity?
- **Advanced Discussion Point:** An exact duplicate might just be a harmless double-click. A conflicting duplicate indicates a discrepancy in financial facts that requires human arbitration.

**Q28: Why do some anomalies have a `suggestedAction`?**
- **Model Answer:** It improves UX. For example, if the description contains "paid back", the engine suggests `CONVERT_TO_SETTLEMENT`. The UI can render a one-click button to apply this resolution.
- **Follow-Up:** Where does the `resolutionAction` data go?
- **Advanced Discussion Point:** It's stored as JSON in the `ImportAnomaly` table. During finalization, the service reads this JSON (e.g., `{ type: "CORRECT_CURRENCY", value: "USD" }`) and mutates the row's `normalizedData`.

**Q29: How do you handle concurrent anomaly reviews?**
- **Model Answer:** Because each anomaly is an independent row with a UUID, multiple admins can review different anomalies simultaneously without lock contention.
- **Follow-Up:** What if two admins review the *same* anomaly?
- **Advanced Discussion Point:** The last write wins. We could implement Optimistic Concurrency Control using an `updatedAt` timestamp to prevent this, but the risk is low for small groups.

**Q30: What happens to anomalies when an import job fails finalization?**
- **Model Answer:** They remain in their `APPROVED` or `REJECTED` states. The job goes to `FAILED`. 
- **Follow-Up:** Does the admin have to re-review everything?
- **Advanced Discussion Point:** No, because the `ImportAnomaly` resolutions were saved in prior, independent requests. They can just try to finalize again once the system issue is resolved.

## Expenses & Settlements

**Q31: How is a `SETTLEMENT_AS_EXPENSE` converted during finalization?**
- **Model Answer:** The system flags the `CONVERT_TO_SETTLEMENT` resolution. During finalization, it infers the receiver by searching the description text for names of other group members. It then delegates creation to the `SettlementService`.
- **Follow-Up:** What if the description doesn't contain a valid name?
- **Advanced Discussion Point:** The finalization will throw an error, rolling back the transaction. We should ideally prompt the admin to explicitly select the receiver during the review phase.

**Q32: Explain the difference between `splitType` EQUAL and PERCENTAGE.**
- **Model Answer:** EQUAL dynamically divides the total among all members active on the expense date. PERCENTAGE requires explicit `split_details` (e.g., 60;40) mapping exactly to the participants.
- **Follow-Up:** How do you handle 100 / 3 ?
- **Advanced Discussion Point:** `33.33` recurring. We calculate the exact fractions and assign the remaining `0.01` remainder to the payer to ensure the sum exactly matches the total amount.

**Q33: Can a settlement involve multiple people?**
- **Model Answer:** No. By definition in our schema, a `Settlement` strictly involves one `fromUserId` and one `toUserId`. 
- **Follow-Up:** How do users settle complex group debts?
- **Advanced Discussion Point:** They don't. They use the `/simplified-balances` endpoint to get a graph of optimal 1-to-1 settlements that clear the entire group's debt network.

**Q34: How do you support foreign currencies in expenses?**
- **Model Answer:** The `Expense` stores the `currency` string (e.g., "USD") and the raw `amount`. It also stores `exchangeRate` and `convertedAmount`.
- **Follow-Up:** Where does the exchange rate come from?
- **Advanced Discussion Point:** Currently, it defaults to `1.0`. In production, the service would ping a Forex API at the time of creation (or use the historical rate based on the expense `date`).

**Q35: Why does `ExpenseParticipant` store the `computedOweAmount`?**
- **Model Answer:** It avoids having to recalculate ratios (like 3 shares vs 7 shares) every time a user views their balance. It caches the final financial liability at the time of expense creation.
- **Follow-Up:** What if the total amount changes?
- **Advanced Discussion Point:** Our application logic currently doesn't support PATCHing expense amounts. If we did, we would have to recalculate and update all `ExpenseParticipant` rows atomically.

## Balances & Finalization

**Q36: Why is the final balance calculation done at runtime rather than storing a running total?**
- **Model Answer:** A running total (materialized view) is vulnerable to race conditions and makes retroactive edits (e.g., inserting an expense from last week) extremely difficult. Calculating O(N) expenses at runtime guarantees 100% accuracy.
- **Follow-Up:** Isn't O(N) slow?
- **Advanced Discussion Point:** For a single group, N rarely exceeds a few thousand records. Postgres can fetch this in milliseconds. If it scales to millions, we would use event-sourced snapshots.

**Q37: Explain the debt simplification algorithm.**
- **Model Answer:** 
  1. We calculate the net balance for every user. 
  2. We separate users into "Debtors" (balance < 0) and "Creditors" (balance > 0). 
  3. We sort both lists.
  4. We match the largest debtor with the largest creditor, generate a settlement suggestion, and subtract the settled amount from both. We repeat until all balances are 0.
- **Follow-Up:** Does this guarantee the minimum number of transactions?
- **Advanced Discussion Point:** A greedy algorithm provides a *near* optimal solution in `O(N)` time. A perfectly optimal solution requires solving a subset-sum variant (NP-Hard), which is overkill for typical group sizes.

**Q38: In `balances.service.ts`, why do you round to 2 decimal places at the very end?**
- **Model Answer:** Floating-point math in JS (`0.1 + 0.2 = 0.30000000000000004`) causes artifacts. We round at the final step to present a clean currency value.
- **Follow-Up:** Should we use integer cents instead?
- **Advanced Discussion Point:** Yes. Storing amounts as integers (e.g., $10.00 as 1000) completely eliminates floating-point issues, but complicates logic for currencies that don't have decimals (like JPY). 

**Q39: What happens if a user's net balance is exactly 0, but they owe User A $10 and User B owes them $10?**
- **Model Answer:** The standard balance view shows Net 0. The simplified balances algorithm will also ignore them, routing User B's $10 directly to User A instead, removing the middleman.
- **Follow-Up:** What if User A and B are in different currencies?
- **Advanced Discussion Point:** Debt simplification only works reliably if all debts are normalized to the group's `baseCurrency` via the `convertedAmount`.

**Q40: How do you verify the Finalization process works without breaking the database during testing?**
- **Model Answer:** We write integration tests that seed a database, trigger the finalization route, assert the data, and then roll back the test database. Alternatively, the Prisma transaction ensures that if we inject an intentional throw at the end, it safely rolls back, proving idempotency.
- **Follow-Up:** How would you test it manually?
- **Advanced Discussion Point:** Using `verify_finalize.ps1`, which hits the endpoint and checks the `status` string returned in the JSON payload, followed by a `GET` request to verify the exact number of expenses inserted.
