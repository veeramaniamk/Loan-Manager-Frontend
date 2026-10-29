# Loan Manager Frontend (Angular)

Modern Angular web client for managing loans, receivables, debt obligations, and daily cash flow.

## Key Features
- **Dashboard**:
  - Existing pending loan amount from people (receivables).
  - Payable amount with due dates (money you owe).
  - Today's cashflow: Spent today vs. Received today.
  - Urgent alerts for loans due today or overdue.
  - Direct quick-collection and quick-repayment modals.
- **Loans & Debt Ledger**:
  - Filter by type (Given vs. Taken), status (Pending, Partially Paid, Settled, Overdue), and location.
  - Automatic geolocation detection ("Use Current Location") or manual location entry.
  - Full payment ledger with installment tracking and history.
- **People Directory**:
  - Shows each debtor and creditor with net financial standing (+ surplus / - debt).
- **Admin Console** (Role: admin):
  - User management: Add, edit, activate/deactivate users, and view total pending debt per user.
  - Monthly Activity: Month-by-month financial volume breakdown.
  - Security Audit Logs: Live inspection of all failed requests caught by the backend security pipeline.

## Development Server
```bash
npm start
```
Navigate to `http://localhost:4200/`.
