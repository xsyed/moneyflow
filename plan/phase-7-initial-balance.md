# Phase 7: Initial Balance Setup

## Goal
Allow users to set their starting balance for accurate calculations.

## Steps

### 7.1 First-Time Setup
On first app load (no settings in localStorage):
- Show welcome dialog prompting for initial balance
- User enters their current balance
- Save to settings with today's date as start date

### 7.2 Settings Dialog Component
File: `src/app/components/settings-dialog/settings-dialog.component.ts`

Fields:
- **Initial Balance** - `mat-form-field` number input
- **Balance Date** - `mat-datepicker` (optional, defaults to today)
  - "As of what date is this balance?"

### 7.3 Settings Access
Add settings icon in toolbar:
- `mat-icon-button` with gear/settings icon
- Opens settings dialog
- Allows changing initial balance anytime

### 7.4 Settings Service Integration
```typescript
// On app init
if (!entryService.settings()) {
  // Open welcome/setup dialog
  openInitialSetupDialog();
}
```

### 7.5 Welcome Dialog
For first-time users:
- Friendly welcome message
- "Let's set up your starting balance"
- Single input for balance amount
- "Get Started" button

## Material Components Used
- `MatDialogModule`
- `MatFormFieldModule`
- `MatInputModule`
- `MatDatepickerModule`
- `MatIconModule`
- `MatToolbarModule`

## Deliverables
- [ ] Settings dialog component
- [ ] First-time welcome/setup flow
- [ ] Settings icon in toolbar
- [ ] Initial balance persisted to localStorage
- [ ] Balance date for accurate calculations


## Phase 7.1 - UI Enhancements (Completed)

### Changes Made:
1. **Moved current balance to header** - Balance now displays in top-right of toolbar beside settings icon, inline with white text and color-coded (green/red)
2. **Fixed tooltip display after initial balance setup** - Added afterClosed subscription to ensure timeline updates
3. **Added delete options for recurring entries** - Created DeleteOptionsDialogComponent that prompts "Delete this occurrence only" or "Delete all occurrences" for recurring entries
4. **Increased timeline width to 85%** - Timeline now uses 85% of screen width (max 1600px) instead of 900px
5. **Added month-end balance summary rows** - Special rows at end of each month showing "Balance as of [date]" with formatted balance
6. **Made day text bold and bigger** - Date labels now 16px and font-weight 700 (was 14px and 500)
7. **Updated app title to "Money Stream"** - Changed from "Income Flow" throughout the app

### Files Modified:
- **Timeline component** - Width increased, day styling enhanced, month-end rows added, delete logic updated to handle single occurrence deletion
- **Balance display component** - Converted from fixed card to inline header component
- **App component** - Title updated, balance moved to header layout
- **Entry service** - Added `deleteSingleOccurrence()` method for marking single recurring occurrences as deleted
- **Entry model** - Added `isDeleted` flag for deletion markers

### New Components:
- **DeleteOptionsDialogComponent** - Dialog for choosing between deleting single occurrence or all occurrences of a recurring entry

### Technical Implementation:
- **Deletion markers**: Single occurrences are deleted by creating a deletion marker entry with `isDeleted: true` flag
- **Month-end detection**: Added `isMonthEnd` boolean to TimelineDate interface, calculated by checking if next day is in different month
- **Balance in header**: Simplified inline layout with icon and amount, color-coded text, responsive hiding of icon on mobile
- **Filtering**: Timeline filters out both deletion markers and occurrences that have deletion markers
