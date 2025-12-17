# Phase 7.4: Limit Recurring Entries to Today and Future

## Overview
Prevent recurring entries (monthly, weekly, biweekly) from appearing in the timeline or balance calculations for past dates. When a user adds a new recurring entry, it only appears from today onwards, never retroactively.

## Problem Statement
Previously, when users added recurring entries:
- Monthly entries would generate occurrences for all past dates based on the `dayOfMonth`
- Weekly/biweekly entries would generate occurrences backward from their `startDate` if it was in the past
- This caused entries to appear retroactively in the timeline and balance calculations
- Users didn't want historical data for entries they're adding today

## Solution
Modified the `generateOccurrences()` function to always limit recurring entries to today or later, while keeping one-time entries unrestricted.

## User Requirements
1. **Recurring entries** (monthly/weekly/biweekly): Only appear from TODAY onwards, never in the past
2. **One-time entries**: Can still be created for any date (past, present, or future)
3. **Weekly/biweekly with past start dates**: Only generate occurrences from today forward

## Changes Made

### 1. Update Date Utilities
**File**: `src/app/utils/date.utils.ts`

**Before**:
```typescript
export function generateOccurrences(
  entry: Entry,
  startDate: Date,
  endDate: Date,
  options?: {
    applyCutoff?: boolean;
    cutoffDate?: Date;
  }
): Date[] {
  // Complex cutoff logic with migration dates...
  if (entry.repeatType !== 'once' && options?.applyCutoff && entry.createdAt && options.cutoffDate) {
    // 12 lines of conditional logic
  }
}
```

**After**:
```typescript
export function generateOccurrences(
  entry: Entry,
  startDate: Date,
  endDate: Date
): Date[] {
  // Simple, always-on logic
  let effectiveStartDate = new Date(startDate);

  if (entry.repeatType !== 'once') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    effectiveStartDate = new Date(Math.max(startDate.getTime(), today.getTime()));
  }
}
```

**Impact**:
- Removed complex conditional logic
- Removed dependency on app settings
- Simpler, more predictable behavior

### 2. Update Entry Service
**File**: `src/app/services/entry.service.ts`

**Changes**:
- Removed cutoff options extraction from settings
- Removed `applyCutoff` and `cutoffDate` parameters from `generateOccurrences()` calls
- Simplified `generateAllOccurrences()` method

### 3. Update Timeline Component
**File**: `src/app/components/timeline/timeline.component.ts`

**Changes**:
- Removed cutoff options extraction from settings
- Removed `applyCutoff` and `cutoffDate` parameters from `generateOccurrences()` calls
- Simplified `getEntriesForDate()` method

### 4. Update Entry Model
**File**: `src/app/models/entry.model.ts`

**Before**:
```typescript
export interface AppSettings {
  initialBalance: number;
  balanceSetDate: string;
  creationDateCutoffEnabled?: boolean;
  creationDateCutoffDate?: string;
}
```

**After**:
```typescript
export interface AppSettings {
  initialBalance: number;
  balanceSetDate: string;
}
```

**Impact**:
- Removed obsolete cutoff settings
- Simpler settings interface

### 5. Update Storage Service
**File**: `src/app/services/storage.service.ts`

**Changes**:
- Removed migration logic that auto-enabled cutoff for existing users
- Simplified `loadSettings()` method

### 6. Update Documentation
**Files**: `CLAUDE.md`, `plan/phase-7.4.md`

**Changes**:
- Added note to Key Decisions: "Recurring entries only appear from today forward, never retroactively"
- Created this phase documentation

## User Experience

### Adding a Monthly Recurring Entry
**Before**: If a user added a "Monthly Rent" entry on the 15th today, it would appear on the 15th of every past month going back months/years.

**After**: The "Monthly Rent" entry only appears on the 15th of this month and future months.

### Adding a Weekly Entry with Past Start Date
**Before**: If a user picked a start date of "two weeks ago" for a weekly entry, it would generate occurrences for those two weeks in the past.

**After**: The entry only generates occurrences from today forward, regardless of the start date selected.

### Adding a One-Time Entry
**No Change**: Users can still add one-time entries for any date (past, present, or future).

## Technical Details

### How It Works
1. When `generateOccurrences()` is called for a recurring entry:
   - Get today's date at midnight (00:00:00)
   - Compare the requested `startDate` with today
   - Use the later of the two as the `effectiveStartDate`
2. For one-time entries:
   - Skip the today check entirely
   - Use the `specificDate` as-is

### Example Scenarios

**Monthly Entry Added Today (Dec 16, 2025)**:
- Entry: Monthly rent on day 10
- First occurrence: Jan 10, 2026 (not Dec 10, 2025)
- Future occurrences: Feb 10, Mar 10, etc.

**Weekly Entry with Past Start Date**:
- Entry: Weekly paycheck, start date = Dec 1, 2025
- Today: Dec 16, 2025
- First occurrence: Dec 16, 2025 (not Dec 1, 8, or 15)
- Future occurrences: Dec 23, Dec 30, Jan 6, etc.

**One-Time Entry for Past Date**:
- Entry: Bonus payment on Dec 5, 2025
- Today: Dec 16, 2025
- Occurrence: Dec 5, 2025 ✓ (shows in timeline and balance)

## Code Cleanup
This phase also removed the old "creation date cutoff" feature that was more complex:
- Required app settings flags
- Required migration logic
- Only applied to new entries created after a cutoff date
- Used entry creation date instead of today's date

The new approach is simpler:
- No settings required
- No migration logic needed
- Always applies to all recurring entries
- Always uses today's date

## Files Modified
1. `src/app/utils/date.utils.ts` - Simplified occurrence generation logic
2. `src/app/services/entry.service.ts` - Removed cutoff parameters
3. `src/app/components/timeline/timeline.component.ts` - Removed cutoff parameters
4. `src/app/models/entry.model.ts` - Removed cutoff settings
5. `src/app/services/storage.service.ts` - Removed migration logic
6. `CLAUDE.md` - Updated key decisions
7. `plan/phase-7.4.md` - This documentation

## Benefits
- **Predictable behavior**: Recurring entries never appear in the past
- **Simpler code**: Removed 50+ lines of conditional logic
- **No migration needed**: Works for all users automatically
- **Better UX**: Users don't see unexpected historical data
- **Cleaner settings**: Removed obsolete configuration options
