import { intervalToDuration, differenceInHours, differenceInDays } from 'date-fns';

export type UserRole = 'master_admin' | 'superadmin' | 'ho_accountant' | 'outlet_manager' | 'outlet_staff' | 'auditor';

export const EDIT_WINDOWS = {
    staff: 24, // hours
    manager: 7, // days
    ho: 30, // days
    admin: 365, // days
    auditor: 0 // View only
};

/**
 * Determines if a transaction can be edited based on the user's role and the transaction date.
 * Enforces the core constraints of the Ledger Module.
 * 
 * Rules:
 * - Staff: Last 24 hours
 * - Manager: Last 7 days
 * - HO Accountant: Last 30 days
 * - Master Admin/Superadmin: Last 1 year
 * - Auditor: View only
 */
export function canEditTransaction(transactionDate: string | Date, role: UserRole | string): { allowed: boolean; reason?: string } {
    if (!role) return { allowed: false, reason: 'No role defined' };

    const roleKey = role.toLowerCase();

    if (roleKey === 'auditor') {
        return { allowed: false, reason: 'Auditor: View only mode' };
    }

    const txDate = new Date(transactionDate);
    const now = new Date();

    // Check if date is valid
    if (isNaN(txDate.getTime())) {
        return { allowed: false, reason: 'Invalid date' };
    }

    const diffInMilliseconds = now.getTime() - txDate.getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);

    if (roleKey === 'outlet_staff') {
        if (diffInHours <= EDIT_WINDOWS.staff) return { allowed: true };
        return { allowed: false, reason: `Staff edit window expired (${EDIT_WINDOWS.staff}h)` };
    }

    if (roleKey === 'outlet_manager') {
        if (diffInDays <= EDIT_WINDOWS.manager) return { allowed: true };
        return { allowed: false, reason: `Manager edit window expired (${EDIT_WINDOWS.manager} days)` };
    }

    if (roleKey === 'ho_accountant') {
        if (diffInDays <= EDIT_WINDOWS.ho) return { allowed: true };
        return { allowed: false, reason: `HO Accountant edit window expired (${EDIT_WINDOWS.ho} days)` };
    }

    if (roleKey === 'master_admin' || roleKey === 'superadmin') {
        if (diffInDays <= EDIT_WINDOWS.admin) return { allowed: true };
        return { allowed: false, reason: `Admin edit window expired (${EDIT_WINDOWS.admin} days)` };
    }

    return { allowed: false, reason: 'Role not authorized for edits' };
}

export function getEditWindowDescription(role: string): string {
    const r = role?.toLowerCase();
    if (r === 'outlet_staff') return '24 Hours';
    if (r === 'outlet_manager') return '7 Days';
    if (r === 'ho_accountant') return '30 Days';
    if (['master_admin', 'superadmin'].includes(r)) return '1 Year';
    return 'View Only';
}
