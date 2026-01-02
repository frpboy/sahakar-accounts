import { differenceInHours, differenceInDays } from 'date-fns';

// 🔐 EDIT WINDOW RULES (CORE CONSTRAINT)
// Rule 4: Time-Bound Edit Authority
export const ROLE_EDIT_WINDOWS_HOURS: Record<string, number> = {
    'outlet_staff': 24,           // 24 Hours
    'outlet_manager': 24 * 7,     // 7 Days
    'ho_accountant': 24 * 30,     // 30 Days
    'master_admin': 24 * 365,     // 1 Year
    'superadmin': 24 * 365,       // 1 Year
    'auditor': 0                  // View Only
};

export interface EditPermission {
    allowed: boolean;
    reason: string;
    actionType: 'edit' | 'reverse' | 'view_only';
    // Rule 3: STRICT Accounting prefers 'reverse'. 'edit' only for minor correction within tight window?
    // User Spec said: "Editing means: Reverse + re-post". So strictly speaking actionType should always be 'reverse' for published ledgers.
    // However, for UX, if it is "Draft" or "Within 5 mins", maybe edit is allowed?
    // Spec says: "Staff on Jan 5 cannot edit Jan 3 ledger". implying they CAN edit Jan 5?
    // "Rule 2: No Deletions... Corrections done via Reversal... Original entry remains immutable".
    // So even within window, it should be Reversal? Or Update? 
    // "Rule 3: Ledger Entries Are Immutable... Once created: No overwrite".
    // OK, this implies ANY change must be a new transaction (Reversal + New).
}

/**
 * Determines if a user can modify a transaction based on STRICT Ledger Rules.
 * Rule 2: No Deletions. Rule 3: Reversals preferred.
 * Rule 4: Time-Bound Windows.
 * Rule 6: Day Lock (Passed optionally or checked server-side)
 */
export function getTransactionPermission(
    ledgerDate: string | Date,
    userRole: string = 'outlet_staff',
    isDayLocked: boolean = false // Rule 7: Lock overrides Role
): EditPermission {
    const roleKey = userRole?.toLowerCase();

    // 1. Check Absolute Day Lock (Rule 6 & 7)
    if (isDayLocked) {
        return {
            allowed: false,
            reason: 'Day is Locked (Daily Close Completed)',
            actionType: 'view_only'
        };
    }

    // 2. Auditor Check
    if (roleKey === 'auditor') {
        return {
            allowed: false,
            reason: 'Auditor: View Only Access',
            actionType: 'view_only'
        };
    }

    // 3. Calculate Time Window from Ledger Date (Rule 7: ledger_date != created_at)
    // Assuming ledgerDate is YYYY-MM-DD or ISO string
    const txDate = new Date(ledgerDate);
    const now = new Date();

    // Safety check for invalid dates
    if (isNaN(txDate.getTime())) {
        return { allowed: false, reason: 'Invalid Date', actionType: 'view_only' };
    }

    const diffHours = Math.abs(differenceInHours(now, txDate));
    const allowedHours = ROLE_EDIT_WINDOWS_HOURS[roleKey] || 0;

    if (diffHours > allowedHours) {
        // Calculate friendly display
        const days = Math.floor(allowedHours / 24);
        return {
            allowed: false,
            reason: `Edit Window Expired (Window: ${days} days)`,
            actionType: 'view_only'
        };
    }

    // 4. Determine Action Type (Rule 3)
    // "Rule 2: No Deletions. Ever... Original entry remains immutable".
    // Thus, even within window, the permission is to 'reverse' (Create Correction), NOT 'edit' (Update Row).
    // UI should show "Adjust" button which triggers Reversal flow.
    return {
        allowed: true,
        reason: 'Within Edit Window',
        actionType: 'reverse'
    };
}


// Backwards compatibility wrapper
export function canEditTransaction(transactionDate: string | Date, role: string): { allowed: boolean, reason: string } {
    const perm = getTransactionPermission(transactionDate, role, false);
    return { allowed: perm.allowed, reason: perm.reason };
}


/**
 * Rule 9: Daily Cash Reconciliation
 * Calculates the expected cash based on Opening + Ledger Inflows - Ledger Outflows.
 */
export interface ReconciliationResult {
    openingCash: number;
    cashIn: number;
    cashOut: number;
    expectedCash: number;
    variance: number;
    isBalanced: boolean;
}

export function calculateReconciliation(
    openingCash: number,
    transactions: any[],
    actualPhysicalCash: number
): ReconciliationResult {
    let cashIn = 0;
    let cashOut = 0;

    transactions.forEach(t => {
        if (t.payment_mode === 'Cash') {
            const amt = Number(t.amount);
            if (t.type === 'income') cashIn += amt;
            else if (t.type === 'expense') cashOut += amt;
        }
    });

    const expectedCash = openingCash + cashIn - cashOut;
    const variance = actualPhysicalCash - expectedCash;

    return {
        openingCash,
        cashIn,
        cashOut,
        expectedCash,
        variance,
        isBalanced: Math.abs(variance) < 0.01 // Handle tiny float issues
    };
}

export function getEditWindowDescription(role: string): string {
    const hours = ROLE_EDIT_WINDOWS_HOURS[role?.toLowerCase()] || 0;
    if (hours === 0) return 'View Only';
    if (hours === 24) return '24 Hours';
    if (hours === 168) return '7 Days';
    return `${hours / 24} Days`;
}
