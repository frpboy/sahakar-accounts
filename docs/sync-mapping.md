# Structured Sync Mapping

Daily Tab `${DDMMYY}`
- Summary (A2:C9):
  - Date
  - Opening Cash
  - Opening UPI
  - Total Income
  - Total Expense
  - Closing Cash
  - Closing UPI
  - Status

Sales Table (E2:I):
- No.
- Sales (amount from transactions.type='income')
- Cash (payment_mode='cash')
- UPI (payment_mode='upi')
- Credit (if available; 0 currently)
- Remarks (transactions.description)

Future Extensions:
- Credit Amount Received (K:M) from collections table
- Deposits (cash/upi settlement) mapping from deposit transactions

