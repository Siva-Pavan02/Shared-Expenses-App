# Shared Expenses App - Backend

## 1. Project Overview
The Shared Expenses App is a robust backend system designed for managing shared costs among dynamic groups. It provides financial tracking with support for complex splits (equal, unequal, percentage, and shares), multi-currency expenses, and membership lifecycle tracking. A core feature of the application is an intelligent CSV import pipeline that automatically detects anomalies and allows group administrators to review, correct, and finalize imported financial records asynchronously.

## 2. Problem Statement
Group expense trackers typically fail when memberships change over time, or when users attempt to bulk-import historical data riddled with typos, missing dates, or unknown users. This system solves these issues by treating group memberships temporally (tracking exact join and leave dates) and enforcing a rigorous staged import workflow that detects data anomalies before they corrupt the financial ledger.

## 3. Architecture Overview
The application is structured as a modular Node.js REST API using Express. It follows a service-oriented architecture where controllers handle HTTP transport and validation (via Zod), services encapsulate business logic (e.g., temporal balance calculation, anomaly detection), and repositories handle data access via Prisma. The database leverages PostgreSQL to enforce strong referential integrity.

## 4. Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JSON Web Tokens (JWT)
- **Testing**: Jest

## 5. Installation
Ensure you have Node.js (v18+ recommended) and PostgreSQL installed.

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## 6. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/shared_expenses?schema=public"
JWT_SECRET="your-secure-development-jwt-secret"
```

## 7. Database Setup & 8. Prisma Commands
The database schema is managed via Prisma. After configuring your `.env`:

To apply migrations and set up the database structure:
```bash
npx prisma migrate dev
```

To regenerate the Prisma client (if modifying the schema):
```bash
npx prisma generate
```

To explore the database in a UI:
```bash
npx prisma studio
```

## 9. Run Commands
To start the application in development mode with live reload:
```bash
npm run dev
```

## 10. Build Commands
To compile TypeScript to JavaScript for production deployment:
```bash
npm run build
npm start
```

## 11. API Summary
All API endpoints have been verified against the current routing implementation.

**Auth**
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate and receive a JWT
- `GET /auth/me` - Retrieve current authenticated user profile

**Groups**
- `POST /groups` - Create a new group
- `GET /groups` - List groups the current user belongs to
- `GET /groups/:id` - Get group details
- `PATCH /groups/:id` - Update group settings
- `DELETE /groups/:id` - Delete a group

**Memberships**
- `POST /groups/:groupId/members` - Add a member to a group
- `GET /groups/:groupId/members` - List group members
- `PATCH /groups/:groupId/members/:memberId/leave` - Mark a member as having left the group

**Expenses**
- `POST /groups/:groupId/expenses` - Create a new expense
- `GET /groups/:groupId/expenses` - List expenses for a group
- `GET /groups/:groupId/expenses/:expenseId` - Get expense details
- `DELETE /groups/:groupId/expenses/:expenseId` - Delete an expense

**Settlements**
- `POST /groups/:groupId/settlements` - Record a payment between users
- `GET /groups/:groupId/settlements` - List settlements for a group
- `GET /groups/:groupId/settlements/:id` - Get settlement details
- `DELETE /groups/:groupId/settlements/:id` - Delete a settlement

**Balances**
- `GET /groups/:groupId/balances` - Get overall group balances
- `GET /groups/:groupId/balances/:userId` - Get detailed breakdown for a specific user
- `GET /groups/:groupId/simplified-balances` - Get an optimized debt simplification graph

**Imports & Anomalies**
- `POST /groups/:groupId/imports/upload` - Upload a CSV file
- `GET /groups/:groupId/imports` - List import jobs for a group
- `GET /groups/:groupId/imports/:id` - Get import job status
- `GET /groups/:groupId/imports/:id/report` - Get import summary report
- `POST /groups/:groupId/imports/:importJobId/analyze` - Trigger anomaly analysis
- `GET /groups/:groupId/imports/:importJobId/anomalies` - List detected anomalies
- `PATCH /anomalies/:id/review` - Approve or reject an anomaly
- `PATCH /anomalies/:id/resolve` - Alias for reviewing an anomaly
- `POST /groups/:groupId/imports/:id/finalize` - Convert approved import rows into ledger entries

## 12. CSV Import Workflow
1. A group admin uploads a CSV file via `POST /groups/:groupId/imports/upload`.
2. The file is parsed into intermediate `ImportRow` records, and an `ImportJob` is created with a `PENDING_REVIEW` or `READY_TO_IMPORT` status.
3. The system automatically triggers the anomaly detection engine across all rows.

## 13. Anomaly Review Workflow
1. The admin fetches the detected anomalies via `GET /groups/:groupId/imports/:importJobId/anomalies`.
2. For any flagged rows, the admin submits a review action (e.g., `APPROVE`, `REJECT`, or applying a fix like `CORRECT_CURRENCY`) via `PATCH /anomalies/:id/review`.
3. An `ImportJob` cannot be finalized until all anomalies are resolved (i.e., no longer `PENDING`).

## 14. Finalization Workflow
1. Once all anomalies are addressed, the admin calls `POST /groups/:groupId/imports/:id/finalize`.
2. The backend opens a strict PostgreSQL transaction.
3. Rows containing any `REJECTED` anomalies are ignored. Valid rows are mapped to `Expense` and `Settlement` tables.
4. If successful, the transaction commits, and the job is marked `COMPLETED`. If any failure occurs, the transaction rolls back, leaving no partial financial data.

## 15. Deployment Instructions
The application is fully stateless and designed for easy containerization or PaaS deployment (e.g., Render, Railway, Fly.io).
- Set the `DATABASE_URL` environment variable to your production PostgreSQL connection string.
- Run `npx prisma migrate deploy` in your build/release script to apply database changes.
- Start the application using `npm run build && npm start`.

## 16. Known Limitations
- The system defaults currency exchange rates to `1.0`. Integrating a live forex API is required for real-time multi-currency support.
- File uploads are processed in memory (`multer.memoryStorage()`) up to 10MB. Extremely large CSV files may require stream-based parsing or direct upload to object storage (e.g., AWS S3).

## 17. Future Improvements
- Implement streaming for the CSV parser to reduce memory overhead on massive files.
- Add real-time WebSocket notifications to alert users when a long-running import job finishes analysis.
- Integrate a third-party API (e.g., OpenExchangeRates) to fetch live conversion rates at the exact timestamp of an expense.
