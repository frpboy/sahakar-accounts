export type UserRole = 'master_admin' | 'ho_accountant' | 'outlet_manager' | 'outlet_staff' | 'auditor' | 'superadmin';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    outlet_id: string | null;
    created_at: string;
}

export interface AuthUser {
    id: string;
    email: string;
    profile: UserProfile | null;
}

export interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export type { ClassValue } from 'clsx';
