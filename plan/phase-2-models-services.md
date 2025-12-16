# Phase 2: Data Models & Services

## Goal
Define data models and create services for state management using Angular Signals.

## Steps

### 2.1 Create Entry Model
File: `src/app/models/entry.model.ts`

```typescript
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
```

### 2.2 Create Storage Service
File: `src/app/services/storage.service.ts`

- `saveEntries(entries: Entry[]): void`
- `loadEntries(): Entry[]`
- `saveSettings(settings: AppSettings): void`
- `loadSettings(): AppSettings | null`
- Use localStorage keys: `moneystream_entries`, `moneystream_settings`

### 2.3 Create Entry Service (State Management)
File: `src/app/services/entry.service.ts`

Use Angular Signals for reactive state:
```typescript
// Signals
entries = signal<Entry[]>([]);
settings = signal<AppSettings | null>(null);

// Computed signals for derived state
// Methods
addEntry(entry: Omit<Entry, 'id' | 'createdAt'>): void
updateEntry(id: string, updates: Partial<Entry>): void
deleteEntry(id: string): void
setInitialBalance(amount: number): void
```

### 2.4 Create Date Utility Functions
File: `src/app/utils/date.utils.ts`

- `generateOccurrences(entry: Entry, startDate: Date, endDate: Date): Date[]`
- `getNextOccurrence(entry: Entry, fromDate: Date): Date`
- `formatDateForDisplay(date: Date): string`

## Deliverables
- [ ] Entry model defined
- [ ] AppSettings model defined
- [ ] StorageService with localStorage persistence
- [ ] EntryService with Signal-based state
- [ ] Date utility functions
