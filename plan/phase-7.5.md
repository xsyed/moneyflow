# Phase 7.5: Balance Indicator & Display Settings

## Overview
Add a balance indicator feature to the timeline that shows running balance after each day's transactions with visual up/down arrows. Also add settings to toggle visibility of both the days skip indicator and the new balance indicator for improved user control and performance.

## Features Implemented

### 1. Balance Indicator
- **Display**: Shown after all entries for each day as a separate row (similar to skip indicator)
- **Styling**: Dashed lines on both sides with balance value in center
- **Arrow Indicators**:
  - Up arrow (↑) in green (#2e7d32) when balance increases
  - Down arrow (↓) in red (#c62828) when balance decreases
  - Material icons (`arrow_upward`, `arrow_downward`)
- **Balance Value**: Running balance (total after all day's transactions)
- **Visibility Rules**:
  - Only shown on days with entries OR today (even with no entries)
  - Only when the "Show balance indicator" setting is enabled

### 2. Display Settings
Two new checkboxes added to Settings dialog:
- **Show days indicator**: Toggles "X days" skip indicator between timeline entries
- **Show balance indicator**: Toggles balance indicator after each day's entries
- Both are **unchecked (hidden) by default**

### 3. Performance Optimization
- Balance change calculations only performed when indicator is enabled
- Skip indicator only rendered when setting is enabled
- Reduces unnecessary computation for users who don't need these features

## Technical Implementation

### Data Model Changes
**File**: `src/app/models/entry.model.ts`
- Updated `AppSettings` interface with optional boolean fields:
  - `showDaysIndicator?: boolean`
  - `showBalanceIndicator?: boolean`

### Service Layer
**File**: `src/app/services/entry.service.ts`
- Added computed signals for reactive settings:
  - `showDaysIndicator = computed(() => this.settings()?.showDaysIndicator ?? false)`
  - `showBalanceIndicator = computed(() => this.settings()?.showBalanceIndicator ?? false)`

### Settings Dialog
**Files**:
- `src/app/components/settings-dialog/settings-dialog.component.ts`
- `src/app/components/settings-dialog/settings-dialog.component.html`
- `src/app/components/settings-dialog/settings-dialog.component.scss`

**Changes**:
- Added `MatCheckboxModule` import
- Added form controls for both checkboxes
- Updated `onSave()` to persist new settings
- Added "Display Options" section with styled checkboxes

### Timeline Component
**Files**:
- `src/app/components/timeline/timeline.component.ts`
- `src/app/components/timeline/timeline.component.html`
- `src/app/components/timeline/timeline.component.scss`

**TypeScript Changes**:
- Updated `TimelineDate` interface with balance indicator fields:
  - `showBalanceIndicator: boolean`
  - `previousDayBalance: number`
  - `balanceChange: 'up' | 'down' | 'none'`
- Added `getPreviousDayBalance()` helper method
- Updated `generateTimelineDates()` to compute balance change data
- Updated `filterRelevantDates()` to set `showBalanceIndicator` flag

**HTML Changes**:
- Made skip indicator conditional on `entryService.showDaysIndicator()`
- Added balance indicator markup with Material icons and conditional styling

**SCSS Changes**:
- Added `.balance-indicator` styles (flex layout)
- Added `.balance-line` styles (dashed line pattern)
- Added `.balance-content` styles with color variants
- Added `.balance-up` (green) and `.balance-down` (red) classes
- Added `.balance-arrow` icon sizing
- Responsive styles for mobile (768px) and small mobile (480px)

## User Experience

### Example Timeline View
```
┌─────────────────────────────────────────────────┐
│ 15 Dec │──│ Paycheck              +$2,500.00   │
│        │  │ Rent                  -$1,200.00   │
├─────────────────────────────────────────────────┤
│ ────── ↑ $3,800.00 ────── (GREEN)              │
├─────────────────────────────────────────────────┤
│            ──── 3 days ────                    │
├─────────────────────────────────────────────────┤
│ 19 Dec │──│ Electric Bill           -$150.00   │
├─────────────────────────────────────────────────┤
│ ────── ↓ $3,650.00 ────── (RED)                │
└─────────────────────────────────────────────────┘
```

### Settings Dialog
Users can now toggle:
1. **Show days indicator** - Controls the "X days" separator
2. **Show balance indicator** - Controls the balance row after entries

Both settings persist to localStorage and take effect immediately.

## Design Decisions

### Default Hidden State
Both indicators are hidden by default to:
- Keep the timeline clean and focused on entries
- Improve performance (no unnecessary calculations)
- Let users opt-in based on their needs

### Running Balance vs Net Change
Display running balance (total after day's transactions) rather than net change because:
- More useful for understanding financial position
- Consistent with month-end balance display
- Arrow provides quick visual cue for direction

### Separate Row Design
Balance indicator as separate row (not inside date row) because:
- Visually separates summary from detail
- Matches skip indicator pattern for consistency
- Easier to scan and understand at a glance

### Material Icons
Use Material icons for arrows instead of text because:
- More professional appearance
- Better visual hierarchy
- Color-coded for quick recognition

## Files Modified
1. `src/app/models/entry.model.ts`
2. `src/app/services/entry.service.ts`
3. `src/app/components/settings-dialog/settings-dialog.component.ts`
4. `src/app/components/settings-dialog/settings-dialog.component.html`
5. `src/app/components/settings-dialog/settings-dialog.component.scss`
6. `src/app/components/timeline/timeline.component.ts`
7. `src/app/components/timeline/timeline.component.html`
8. `src/app/components/timeline/timeline.component.scss`
9. `CLAUDE.md` (documentation)
10. `plan/phase-7.5.md` (this file)

## Testing Considerations
While no automated tests are written, manual testing should verify:
- Balance calculations are accurate
- Arrows show correct direction (up/down/none)
- Settings persist across page reloads
- Performance is good when indicators are disabled
- Mobile responsive design works correctly
- Colors are accessible and distinguishable

## Future Enhancements
Potential improvements for later phases:
- Option to show percentage change instead of/in addition to balance
- Customize indicator colors
- Show balance indicator on month boundaries
- Export balance history
