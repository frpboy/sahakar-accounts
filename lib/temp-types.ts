import { Database } from './database.types';

export type DailyRecord = Database['public']['Tables']['daily_records']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
