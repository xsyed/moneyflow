export type RepeatType = 'monthly' | 'weekly' | 'biweekly';
export type EntryType = 'income' | 'expense';

export interface Entry {
  id: string;
  label: string;
  amount: number;
  type: EntryType;
  dayOfMonth?: number;      // 1-31, used for monthly
  startDate?: string;       // ISO date string, used for weekly/biweekly
  repeatType: RepeatType;
  createdAt: string;
}

export interface AppSettings {
  initialBalance: number;
  balanceSetDate: string;   // Date from which balance calculations start
}
