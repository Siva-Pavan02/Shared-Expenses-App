# Architectural and Design Decisions

This document outlines the major architectural and design decisions made during the development of the Shared Expenses App, including alternatives considered, tradeoffs, and the final rationale.

## 1. Membership Validation Strategy
**Problem:** Group memberships change over time, and expenses should only be split among members who were active on the exact date of the expense.
**Alternatives Considered:**
1. *Static Membership:* Assume everyone currently in the group is liable for all past expenses.
2. *Snapshotting:* Save a copy of the group state with every expense.
3. *Temporal Tables:* Use `joinedAt` and `leftAt` timestamps for group members to compute active status dynamically.
**Tradeoffs:** Static membership is inaccurate. Snapshotting consumes significant storage and complicates data integrity. Temporal tables require slightly more complex queries but offer the highest accuracy and flexibility.
**Final Choice:** Temporal Tables (`joinedAt` and `leftAt`).
**Why It Was Chosen:** This allows accurate historical balance calculations without data duplication. During import finalization, the active members on the `date` of the expense are dynamically evaluated.

## 2. Staged Import Pipeline & Review-Based Import Workflow
**Problem:** Processing a CSV file directly into expenses can lead to corrupted data if errors exist halfway through the file. The system needs a way to catch errors before they mutate the financial ledger.
**Alternatives Considered:**
1. *Synchronous Processing:* Process and insert expenses immediately, failing the whole HTTP request if one row is bad.
2. *Staged Import Pipeline:* Parse the CSV into an intermediate staging table (`ImportRow`), run anomaly detection offline, allow user review, and explicitly require a separate finalization step.
**Tradeoffs:** Synchronous processing provides immediate feedback but offers a poor user experience for large files with minor typos. The staged approach adds complexity (state management, intermediate tables) but guarantees data integrity and provides a seamless review experience.
**Final Choice:** Staged Import Pipeline with a Review-Based Import Workflow.
**Why It Was Chosen:** The system parses the CSV into `ImportRow` records, runs anomaly detection to create `ImportAnomaly` records, and waits for admin approval before converting valid rows into real `Expense` and `Settlement` records.

## 3. Transactional Finalization Process
**Problem:** Finalizing an import job involves writing to multiple tables (`Expense`, `ExpenseParticipant`, `Settlement`, `ImportJob`, `ImportRow`). A failure midway would leave the database in an inconsistent state.
**Alternatives Considered:**
1. *Application-level compensation logic:* Manually deleting inserted rows if an error occurs.
2. *Transactional Finalization Process:* Wrapping the entire finalization logic in a single ACID database transaction.
**Tradeoffs:** Application-level logic is highly error-prone and can fail during server crashes. Database transactions lock resources but guarantee atomicity.
**Final Choice:** Transactional Finalization Process using Prisma's `$transaction` API.
**Why It Was Chosen:** If any expense fails to insert, the entire import job remains in the `FINALIZING` or `FAILED` state, and no partial financial data is committed. We explicitly lock the `ImportJob` status to `FINALIZING` before starting the transaction to prevent concurrent execution.

## 4. Currency Conversion
**Problem:** The app must support multiple currencies while tracking group balances in a single base currency.
**Alternatives Considered:**
1. *Store only base currency:* Convert everything on write.
2. *Store original currency + Exchange Rate:* Save the original `amount`, `currency`, the `exchangeRate` at the time, and the `convertedAmount`.
**Tradeoffs:** Storing only base currency destroys the original data, making audits impossible. Storing all components takes slightly more space but preserves historical accuracy.
**Final Choice:** Store original currency + Exchange Rate.
**Why It Was Chosen:** Every `Expense` and `Settlement` records the raw currency details and a `convertedAmount` (currently defaulting to a 1.0 exchange rate, easily extensible via external API integration). Balances are computed against the `convertedAmount`.

## 5. Authorization Strategy
**Problem:** We need to secure API endpoints so that only group members can see expenses, and only admins can finalize imports.
**Alternatives Considered:**
1. *Global Admin Roles:* Simple role string on the User model.
2. *Group-Level Roles:* An `isAdmin` boolean on the `GroupMember` junction table.
**Tradeoffs:** Global roles do not map to the reality of isolated groups. Group-level roles perfectly encapsulate context-specific permissions.
**Final Choice:** Group-Level Roles.
**Why It Was Chosen:** A user can be an admin in Group A but a regular member in Group B. Middleware checks the JWT token and cross-references it against the `GroupMember` table for the specific `groupId` in the route path.
