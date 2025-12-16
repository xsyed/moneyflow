export type RepeatType = 'monthly' | 'weekly' | 'biweekly' | 'once';
export type EntryType = 'income' | 'expense';

export interface Entry {
  id: string;
  label: string;
  amount: number;
  type: EntryType;
  dayOfMonth?: number;      // 1-31, used for monthly repeat
  startDate?: string;       // ISO UTC string, used for weekly/biweekly repeat
  repeatType: RepeatType;   // 'once' for one-time entries on specificDate
  specificDate?: string;    // ISO UTC string, used when repeatType is 'once'
  createdAt: string;        // ISO UTC string
  parentEntryId?: string;   // If this is a one-time override, reference to parent recurring entry
}

export interface AppSettings {
  initialBalance: number;
  balanceSetDate: string;   // Date from which balance calculations start
}
