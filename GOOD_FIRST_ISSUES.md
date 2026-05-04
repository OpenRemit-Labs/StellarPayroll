# Good First Issues

These are well-scoped, beginner-friendly contributions to StellarPayroll. Each one has clear acceptance criteria and doesn't require deep knowledge of the full codebase.

---

## Frontend

### 1. Add loading skeleton to payroll table
**Difficulty**: Easy  
**Area**: Frontend / UI  
Replace the spinner in the payrolls table with a skeleton loader (gray animated placeholder rows) while data is loading.  
**Files**: `frontend/src/pages/Dashboard.tsx`

---

### 2. Add "Copy to clipboard" for wallet addresses
**Difficulty**: Easy  
**Area**: Frontend / UI  
Add a copy icon next to truncated wallet addresses in the Employees table. Clicking it copies the full address and shows a toast.  
**Files**: `frontend/src/pages/Employees.tsx`

---

### 3. Add empty state illustration to Employees page
**Difficulty**: Easy  
**Area**: Frontend / UI  
When there are no employees, show a friendly illustration or icon with a CTA to add the first employee or import CSV.

---

### 4. Validate Stellar address format on employee form
**Difficulty**: Easy  
**Area**: Frontend / Validation  
Stellar public keys start with `G` and are exactly 56 characters. Add client-side validation to the wallet address field in the Add Employee form.  
**Files**: `frontend/src/pages/Employees.tsx`

---

### 5. Add payroll filter by status on Dashboard
**Difficulty**: Medium  
**Area**: Frontend  
Add a status filter dropdown (All / Draft / Completed / Failed) to the recent payrolls table on the Dashboard.  
**Files**: `frontend/src/pages/Dashboard.tsx`

---

## Backend

### 6. Add pagination to employee list endpoint
**Difficulty**: Easy  
**Area**: Backend / API  
Add `?page=1&limit=50` query params to `GET /api/employees/org/:orgId`. Return `{data, total, page, limit}`.  
**Files**: `backend/src/routes/employees.ts`

---

### 7. Add input validation to payroll creation
**Difficulty**: Easy  
**Area**: Backend / Validation  
Use `express-validator` to validate that `items[].amount` is a positive number and `items[].employeeId` is a valid UUID in `POST /api/payrolls/org/:orgId`.  
**Files**: `backend/src/routes/payrolls.ts`

---

### 8. Add `GET /api/employees/:id` endpoint
**Difficulty**: Easy  
**Area**: Backend / API  
Add a single-employee fetch endpoint that returns the employee with their org details.  
**Files**: `backend/src/routes/employees.ts`

---

### 9. Return fee_charged from Stellar in transaction record
**Difficulty**: Medium  
**Area**: Backend / Stellar  
After a successful transaction, fetch the `fee_charged` field from the Horizon response and store it in the `transactions` table.  
**Files**: `backend/src/stellar/bulkPayout.ts`, `backend/src/routes/payrolls.ts`

---

### 10. Write unit tests for FXService
**Difficulty**: Medium  
**Area**: Backend / Testing  
Set up Jest and write unit tests for `FXService.getRates()` — test the mock fallback path and the error fallback path.  
**Files**: `backend/src/stellar/fxRates.ts`  
**Setup needed**: Add `jest`, `ts-jest`, `@types/jest` to devDependencies.

---

## Documentation

### 11. Add CSV import format documentation
**Difficulty**: Easy  
**Area**: Docs  
Add a `docs/csv-import.md` file documenting the expected CSV format for bulk employee import, with an example file.

---

### 12. Add deployment guide for Railway / Render
**Difficulty**: Medium  
**Area**: Docs / DevOps  
Write `docs/deployment.md` with step-by-step instructions for deploying the backend to Railway or Render and the frontend to Vercel.

---

## How to Claim an Issue

1. Comment on the issue: "I'd like to work on this"
2. Fork the repo and create a branch: `git checkout -b fix/issue-title`
3. Submit a PR referencing the issue: `Closes #N`

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.
