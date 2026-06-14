# Testing & Verification Guide

This document outlines the actual verification methods performed to ensure the system functions correctly. The codebase includes a suite of PowerShell scripts designed to test the critical asynchronous CSV import and finalization workflows.

## 1. Authentication & Health Check Verification
To verify the system is running and accepting auth requests:
```powershell
node gen_token.js
```
*Result:* Generates a valid JWT token signed with the local `JWT_SECRET` for testing authenticated routes.

## 2. CSV Upload Verification
The `verify_upload.ps1` script tests the Multer middleware and initial file parsing.
```powershell
.\verify_upload.ps1
```
*Verification Performed:* 
- Submits a `multipart/form-data` request with a sample `.csv` file to `POST /groups/:groupId/imports/upload`.
- Verifies the server responds with a `201 Created` and an `importJobId`.

## 3. Anomaly Analysis Verification
The `verify_anomalies.ps1` script tests the asynchronous anomaly detection engine.
```powershell
.\verify_anomalies.ps1
```
*Verification Performed:*
- Uses a provided `importJobId` to query `GET /groups/:groupId/imports/:importJobId/anomalies`.
- Verifies that the engine successfully flagged rows with `MISSING_PAYER`, `INVALID_DATE`, and `SETTLEMENT_AS_EXPENSE`.
- Simulates the admin review process by sending `PATCH /anomalies/:id/review` with `APPROVE` or `REJECT` payloads.

## 4. Import Finalization Verification
The `verify_finalize.ps1` script tests the critical transactional finalization logic.
```powershell
.\verify_finalize.ps1
```
*Verification Performed:*
- Sends a request to `POST /groups/:groupId/imports/:id/finalize`.
- Verifies that the system safely skips `REJECTED` rows.
- Verifies that the database `$transaction` correctly commits the `Expense` and `Settlement` records to the database.
- Confirms the `ImportJob` status transitions to `COMPLETED`.

## 5. Balance Calculations
Manual verification of the balance logic can be performed via cURL after a successful finalization:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/groups/<groupId>/simplified-balances
```
*Verification Performed:*
- Ensures that the calculated simplified debts perfectly offset the actual total amounts logged in the `Expense` and `Settlement` tables, avoiding floating-point inaccuracies.
