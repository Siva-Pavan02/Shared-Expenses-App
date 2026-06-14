# AI Usage Report

## 1. CSV `snake_case` vs `Title Case` Mismatch

**Prompt Used:** "Write a CSV parsing service in TypeScript using the `csv-parser` library that reads an uploaded buffer and returns an array of objects."
**AI Output Summary:** The AI provided a standard implementation of `csv-parser` wrapped in a Promise. It assumed standard, developer-friendly lowercase `snake_case` headers (e.g., `paid_by`, `split_type`).
**Mistake Introduced:** The implementation strictly accessed properties via `data['paid_by']` and `data['split_type']`.
**How It Was Discovered:** During end-to-end testing with the provided `test_expenses.csv` file, the import job flagged 100% of the rows with `MISSING_PAYER` and `MISSING_CURRENCY` anomalies.
**Root Cause:** The actual CSV file used human-readable headers with Title Case and spaces (e.g., "Paid By", "Split Type"). The parser could not find the exact keys.
**Fix Applied:** We added a normalization step (`normalizeHeaders: true` equivalent) that intercepts the headers, strips whitespace, trims, and forces lowercase snake_case *before* assigning keys to the row object.
**Verification Method:** Re-running the `verify_upload.ps1` script with the sample CSV and checking that rows were parsed into `ImportRow` models successfully.

---

## 2. Import Middleware Routing Issue (DoS Vulnerability)

**Prompt Used:** "Write the Express router for handling CSV uploads for the Import module. Only Group Admins should be able to upload. Use `multer` for memory storage."
**AI Output Summary:** The AI provided a route like: `router.post('/upload', upload.single('file'), authenticateJWT, authorizeGroupAdmin, importController.uploadCsv);`
**Mistake Introduced:** The `upload.single('file')` middleware was placed *before* the authentication and authorization middlewares.
**How It Was Discovered:** During a security review of the routing layer. 
**Root Cause:** The AI followed a pattern of declaring body parsers before guards. This meant the server would buffer and process the entire file upload into memory *before* checking if the user even had a valid JWT. This opens up a massive Denial of Service (DoS) vulnerability.
**Fix Applied:** Swapped the middleware order so it explicitly reads: `router.post('/upload', authenticateJWT, authorizeGroupAdmin, upload.single('file'), importController.uploadCsv);`.
**Verification Method:** Attempting to upload a file without an `Authorization` header and ensuring it was immediately rejected with a `401 Unauthorized` before hitting the Multer parser.

---

## 3. FAILED Import Retry Bug (Transaction Integrity)

**Prompt Used:** "Write the `finalizeImport` method in the ImportService. It needs to loop over all rows, insert expenses and settlements, and update the import job to COMPLETED. If anything fails, it should catch the error and mark the job as FAILED."
**AI Output Summary:** The AI provided a large asynchronous loop that used Prisma sequentially. Inside the `catch` block, it updated the `ImportJob` status to `FAILED`.
**Mistake Introduced:** The AI used standard `await prisma.expense.create()` calls *outside* of a database transaction. 
**How It Was Discovered:** During stress testing, a simulated error was injected on the 50th row of a 100-row CSV. The job was marked `FAILED`, but the first 49 expenses were fully persisted to the database.
**Root Cause:** The application-level `try/catch` cannot magically undo previous `INSERT` queries. The AI failed to utilize a true database transaction.
**Fix Applied:** Refactored the entire method to use Prisma's `$transaction`. If the inner transaction throws, Prisma automatically issues a `ROLLBACK`. The `try/catch` block was moved to wrap the *entire* `$transaction` call, so it only updates the job status *after* the rollback occurs.
**Verification Method:** Using `verify_finalize.ps1` with intentionally corrupted data to ensure 0 rows were inserted into the `Expense` table when the transaction threw an error.
