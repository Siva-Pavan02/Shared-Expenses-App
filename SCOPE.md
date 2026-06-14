# Project Scope & Business Rules

## 1. Database Schema Overview & Entity Relationships
The PostgreSQL database is managed via Prisma and structured as follows:

- **User**: The root entity representing an individual.
- **Group**: Represents a shared tracking context. Has a `baseCurrency`.
- **GroupMember**: Junction table mapping `User` to `Group`. Tracks temporal bounds (`joinedAt` and `leftAt`).
- **Expense**: Represents a financial transaction paid by one `User` on behalf of the `Group`. Contains metadata (`amount`, `currency`, `date`, `splitType`).
- **ExpenseParticipant**: Represents a specific `User`'s calculated share of an `Expense` (`computedOweAmount`).
- **Settlement**: Represents a direct reimbursement from one `User` to another `User` within a `Group`.
- **ImportJob**: Represents an asynchronous CSV upload session.
- **ImportRow**: Represents a single CSV row linked to an `ImportJob`, holding `rawData` and `normalizedData`.
- **ImportAnomaly**: Represents a specific validation failure on an `ImportRow`.

## 3. Business Rules

### 4. Membership Rules
- A user's liability for group expenses is strictly bound by their active membership window.
- The `joinedAt` date acts as the start bound. The optional `leftAt` date acts as the end bound.
- If a user is removed from a group, they are not physically deleted if financial records (Expenses or Settlements) exist, ensuring ledger integrity.

### 5. Expense Rules
- Expenses must have a valid, parsed `date`.
- Expenses support multiple splits: EQUAL (divided among all active members on that date), UNEQUAL (explicit amounts), PERCENTAGE (explicit ratios), and SHARE (explicit shares).
- Every expense tracks both the native `currency`/`amount` and a `convertedAmount` (to normalize calculations to the group's base currency).

### 6. Settlement Rules
- Settlements represent debts being repaid.
- A settlement must have a distinct `fromUserId` (payer) and `toUserId` (receiver).
- They are also currency-aware and use `convertedAmount` for net balance calculations.

### 7. Balance Rules
- Group balances are calculated dynamically from the ledger.
- A user's net balance is: `(Total Expenses Paid - Total Expenses Owed) + (Total Settlements Paid - Total Settlements Received)`.
- Simplified balances use a debt simplification algorithm to minimize the total number of transactions required to settle all debts in the group.

### 8. Import Rules
- Imports are strictly asynchronous. The uploaded file is staged into `ImportRow` records before any financial ledgers are altered.
- During finalization, if any anomaly within a row is marked `REJECTED`, the entire row is skipped (`IGNORED`).
- The entire finalization process runs within a PostgreSQL `$transaction`. A single failure causes a complete rollback.

## Verified CSV Anomaly Detection Catalog
The anomaly detection engine automatically flags the following scenarios during the import staging phase. These match the exact implementation in `anomaly-detection.service.ts`.

| Anomaly Type | Severity | Detection Logic | Resolution Options | Final Behavior |
| --- | --- | --- | --- | --- |
| `MISSING_PAYER` | HIGH | The `paid_by` field is null or empty. | `APPROVE` with corrected payer or `REJECT`. | Wait for Review. |
| `MISSING_CURRENCY` | HIGH | The `currency` field is null or empty. | `APPROVE` with corrected currency (`CORRECT_CURRENCY` action) or `REJECT`. | Wait for Review. |
| `INVALID_DATE` | HIGH | The `date` field fails JavaScript's `Date.parse()`. | `APPROVE` with corrected date (`CORRECT_DATE` action) or `REJECT`. | Wait for Review. |
| `AMBIGUOUS_DATE` | MEDIUM | The `date` field contains forward slashes (`/`), indicating potential MM/DD vs DD/MM confusion. | `APPROVE` as-is, `APPROVE` with format correction, or `REJECT`. | Wait for Review. |
| `UNKNOWN_MEMBER` | HIGH | The provided `paid_by` name cannot be mapped to a user in the `GroupMember` table. | `APPROVE` by mapping to correct user, or `REJECT`. | Wait for Review. |
| `MEMBERSHIP_VIOLATION` | HIGH | The parsed `date` falls before the payer's `joinedAt` or after their `leftAt`. | `REJECT` or `APPROVE` if overriding the violation is intended. | Wait for Review. |
| `NEGATIVE_AMOUNT` | MEDIUM | The `amount` field parses to a value `< 0`. | Manual review required to ensure it is intended (e.g., a refund). | Wait for Review. |
| `ZERO_AMOUNT` | LOW | The `amount` field parses to exactly `0`. | Informational flag. Can be approved or rejected. | Wait for Review. |
| `SPLIT_TYPE_CONFLICT` | HIGH | The `split_type` is EQUAL, but explicit `split_details` are provided. | Requires admin intervention to resolve the conflicting data intent. | Wait for Review. |
| `SETTLEMENT_AS_EXPENSE` | HIGH | The `description` contains both the words "paid" and "back" (case-insensitive). | Can be resolved with a `CONVERT_TO_SETTLEMENT` action. | Suggests `Convert to Settlement`. |
| `EXACT_DUPLICATE` | WARNING | An existing `Expense` matches the description, date, payer, and exact amount. | Allows the admin to `REJECT` the row to prevent double-charging. | Wait for Review. |
| `CONFLICTING_DUPLICATE` | HIGH | An existing `Expense` matches the description, date, and payer, but the amount differs. | Prevents silent data corruption. Requires admin verification. | Wait for Review. |
