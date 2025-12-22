import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(dateObj);
}

export function getRoleDashboard(role: string): string {
    switch (role) {
        case 'superadmin':
        case 'master_admin':
            return '/dashboard/admin';
        case 'ho_accountant':
            return '/dashboard/accountant';
        case 'outlet_manager':
            return '/dashboard/manager';
        case 'outlet_staff':
            return '/dashboard/staff';
        default:
            return '/dashboard';
    }
}
