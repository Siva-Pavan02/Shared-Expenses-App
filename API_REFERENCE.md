# API Reference

This document outlines the verified API endpoints for the Shared Expenses App. 

## Authentication

### Register
- **Method**: `POST`
- **Route**: `/auth/register`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "token": "jwt-token-string"
  }
  ```

### Login
- **Method**: `POST`
- **Route**: `/auth/login`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "token": "jwt-token-string"
  }
  ```

---

## Groups

### Create Group
- **Method**: `POST`
- **Route**: `/groups`
- **Auth**: Required (`Bearer`)
- **Request Body**:
  ```json
  {
    "name": "Trip to Paris",
    "baseCurrency": "EUR"
  }
  ```
- **Response** (201 Created): Returns the created Group object.

---

## Imports & Anomalies

### Upload CSV
- **Method**: `POST`
- **Route**: `/groups/:groupId/imports/upload`
- **Auth**: Required + Group Admin
- **Request Body**: `multipart/form-data` with a `file` field containing the `.csv`.
- **Response** (201 Created):
  ```json
  {
    "id": "import-job-uuid",
    "status": "PENDING_REVIEW",
    "message": "Upload successful. Analysis started."
  }
  ```

### List Anomalies
- **Method**: `GET`
- **Route**: `/groups/:groupId/imports/:importJobId/anomalies`
- **Auth**: Required
- **Response** (200 OK): Array of `ImportAnomaly` objects for the job.

### Review Anomaly
- **Method**: `PATCH`
- **Route**: `/anomalies/:id/review`
- **Auth**: Required + Group Admin
- **Request Body**:
  ```json
  {
    "action": "APPROVE",
    "resolutionAction": {
      "type": "CORRECT_CURRENCY",
      "value": "USD"
    }
  }
  ```
- **Response** (200 OK): The updated anomaly.

### Finalize Import
- **Method**: `POST`
- **Route**: `/groups/:groupId/imports/:id/finalize`
- **Auth**: Required + Group Admin
- **Request Body**: None
- **Response** (200 OK):
  ```json
  {
    "status": "COMPLETED",
    "createdExpenses": 45,
    "createdSettlements": 2
  }
  ```
- **Error Responses**: `400 Bad Request` if anomalies are still pending.

---

## Expenses

### Create Expense
- **Method**: `POST`
- **Route**: `/groups/:groupId/expenses`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "description": "Dinner",
    "amount": 100,
    "currency": "USD",
    "date": "2026-06-14T10:00:00Z",
    "splitType": "EQUAL"
  }
  ```
- **Response** (201 Created): The created Expense object.

---

## Balances

### Get Simplified Balances
- **Method**: `GET`
- **Route**: `/groups/:groupId/simplified-balances`
- **Auth**: Required
- **Response** (200 OK):
  ```json
  [
    {
      "fromUserId": "user-a-uuid",
      "fromUserName": "Alice",
      "toUserId": "user-b-uuid",
      "toUserName": "Bob",
      "amount": 50
    }
  ]
  ```
