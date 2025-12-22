import { z } from 'zod';

// Transaction validation
export const TransactionSchema = z.object({
    dailyRecordId: z.string().uuid('Invalid daily record ID'),
    type: z.enum(['income', 'expense'], {
        errorMap: () => ({ message: 'Type must be income or expense' })
    }),
    category: z.string().min(1, 'Category is required'),
    paymentMode: z.enum(['cash', 'upi'], {
        errorMap: () => ({ message: 'Payment mode must be cash or upi' })
    }),
    amount: z.number()
        .positive('Amount must be positive')
        .max(10000000, 'Amount too large (max 10M)')
        .multipleOf(0.01, 'Amount can have max 2 decimal places'),
    description: z.string().optional(),
    createdBy: z.string().uuid().optional(),
});

export type TransactionInput = z.infer<typeof TransactionSchema>;

// Daily Record validation
export const DailyRecordSchema = z.object({
    outletId: z.string().uuid('Invalid outlet ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    openingCash: z.number().min(0, 'Opening cash cannot be negative').default(0),
    openingUpi: z.number().min(0, 'Opening UPI cannot be negative').default(0),
});

// User creation validation
export const UserCreateSchema = z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['master_admin', 'ho_accountant', 'outlet_manager', 'outlet_staff']),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number').optional(),
    outletId: z.string().uuid().optional(),
});

// Outlet creation validation
export const OutletCreateSchema = z.object({
    name: z.string().min(2, 'Outlet name required'),
    code: z.string().min(2, 'Outlet code required').max(20, 'Code too long'),
    location: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional(),
});

// Query params validation
export const PaginationSchema = z.object({
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
});

export const DateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
