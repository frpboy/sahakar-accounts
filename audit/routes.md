# Route Wiring Audit & Security Gating

## Navigational Integrity
| Route | Visibility | Role Gating | Lock Enforcement | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | Sidebar | Role-based | N/A | 🟢 |
| `/dashboard/ledger/register` | Sidebar | All | View-Only > 24h* | 🟢 |
| `/dashboard/ledger/day-book` | Sidebar | All | Read-Only | 🟢 |
| `/dashboard/ledger/anomalies` | Sidebar | Admin+ | Read-Only (Auditor) | 🟢 |
| `/dashboard/reports` | Sidebar | Admin+ | N/A | 🟢 |
| `/dashboard/management/users` | Sidebar | Admin | N/A | 🟢 |
| `/rest` | Automated | Force-Redirect | Full Block | 🟢 |

## Orphaned / Danger Routes
| Route | Type | Risk | Recommendation |
| :--- | :--- | :--- | :--- |
| `/anomalies` | Placeholder | Medium | Delete; redundant with `/dashboard/ledger/anomalies`. |
| `/dashboard/accountant` | Dead Link | Low | Delete; superseded by role-based dashboard. |
| `/dashboard/auditor` | Dead Link | Low | Delete; superseded by role-based dashboard. |
| `/dashboard/ledger/journal` | Orphan | Low | Verify if intended for manual journal entries. |

## Role Gate Verification
- **Auditor**: Sidebar filters out transactional pages (Sales, Expenses). Access to Ledger remains.
- **Outlet Staff**: Restricted to their own outlet. No access to HO Management.
- **HO Accountant**: Access to consolidated reports and all outlets.

## Critical Findings
1. **Middleware Logging**: `middleware.ts` correctly logs `view_page` actions to `audit_logs`. This creates a robust breadcrumb trail of user activity.
2. **Auditor Immutability**: `middleware.ts` (Line 89) explicitly blocks `POST/PUT/PATCH/DELETE` for the `auditor` role, providing a second layer of defense on top of RLS.
3. **Hardcoded Stats**: `/dashboard/reports` contains mock data (23 screens, 11 users). Needs dynamic wiring.
