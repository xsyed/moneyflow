# Phase 7.3: Non-Recurring Entries

## Overview
Add support for creating non-recurring (one-time) entries in addition to the existing recurring entry types. Users will be able to select "Once" as a repeat type option and specify a specific date for the entry to occur.

## Current State
The application currently supports recurring entries with three repeat types:
- Monthly (repeats on a specific day of each month)
- Weekly (repeats every 7 days from a start date)
- Biweekly (repeats every 14 days from a start date)

The data model already supports one-time entries with `repeatType: 'once'` and a `specificDate` field, but the UI does not expose this option to users.

## Changes

### 1. Entry Dialog Component (TypeScript)
**File:** `src/app/components/entry-dialog/entry-dialog.component.ts`

**Changes Made:**
- Added 'once' to the `repeatTypes` array as the first option
- Added `specificDate` form control to `entryForm`
- Updated `updateValidators()` method to handle 'once' repeat type validation
- Updated `onSave()` method to process one-time entries with `specificDate`

**Key Logic:**
- When `repeatType === 'once'`:
  - Require `specificDate` field
  - Clear validators for `dayOfMonth` and `startDate`
  - Convert `specificDate` to UTC before saving

### 2. Entry Dialog Template (HTML)
**File:** `src/app/components/entry-dialog/entry-dialog.component.html`

**Changes Made:**
- Added 'Once' option as the first item in the repeat type dropdown
- Added conditional date picker field that shows when `repeatType === 'once'`
- Date picker uses Material datepicker component, similar to the weekly/biweekly start date field

**UI Behavior:**
- Monthly: Shows day of month dropdown (1-31)
- Weekly/Biweekly: Shows start date picker
- Once: Shows specific date picker

## User Experience

### Creating a One-Time Entry
1. User clicks "Add Entry" button in the timeline
2. Entry dialog opens
3. User sees "Once" as the first option in the repeat type dropdown
4. User selects "Once"
5. A date picker field appears labeled "Date"
6. User fills in:
   - Label (e.g., "Bonus Payment")
   - Amount (e.g., $1000)
   - Type (Income or Expense)
   - Date (selects from date picker)
7. User clicks "Save"
8. Entry is created and appears on the timeline on the specified date only

### Editing a One-Time Entry
1. User clicks the edit button on a one-time entry in the timeline
2. Entry dialog opens with all fields pre-populated
3. Repeat type shows "Once" selected
4. Date picker shows the current date of the entry
5. User can modify any field including the date
6. User clicks "Save"
7. Entry is updated with the new values

## Technical Details

### Form Controls
The entry form now has three conditional date fields:
- `dayOfMonth`: Number (1-31) - shown when `repeatType === 'monthly'`
- `startDate`: Date - shown when `repeatType === 'weekly' || repeatType === 'biweekly'`
- `specificDate`: Date - shown when `repeatType === 'once'`

### Data Storage
One-time entries are stored with:
```typescript
{
  id: string,
  label: string,
  amount: number,
  type: 'income' | 'expense',
  repeatType: 'once',
  specificDate: string,  // ISO UTC string
  createdAt: string
}
```

### Integration with Existing Features
- Timeline display: One-time entries appear on their specified date
- Balance calculations: One-time entries are included in daily balance calculations
- Edit/Delete: One-time entries can be edited or deleted like any other entry
- No "This only" vs "All future" prompt needed (since they're already one-time)

## Files Modified
1. `CLAUDE.md` - Added Phase 7.3 to Implementation Phases table
2. `plan/phase-7.3.md` - This documentation file
3. `src/app/components/entry-dialog/entry-dialog.component.ts` - Form control, validation, save logic
4. `src/app/components/entry-dialog/entry-dialog.component.html` - UI controls for 'Once' option

## No Changes Needed
- Data model already supports one-time entries
- Entry service already processes them correctly
- Date utilities already handle one-time entry generation
- Timeline component already displays them properly

---

# Phase 7.3.1: Optional Note Field

## Overview
Add an optional `note` field to entries that allows users to add additional context or details to any entry. The note appears below the label in both the entry dialog and timeline display.

## Changes

### 1. Entry Model
**File:** `src/app/models/entry.model.ts`

**Changes Made:**
- Added optional `note?: string` field to the Entry interface
- Field has a maximum length of 100 characters

### 2. Entry Dialog Component (TypeScript)
**File:** `src/app/components/entry-dialog/entry-dialog.component.ts`

**Changes Made:**
- Added `note` form control to `entryForm` with `Validators.maxLength(100)`
- Updated `onSave()` method to include note field in entry data
- Note is trimmed and set to `undefined` if empty to keep data clean

### 3. Entry Dialog Template (HTML)
**File:** `src/app/components/entry-dialog/entry-dialog.component.html`

**Changes Made:**
- Added note input field positioned below the label field
- Single-line input with 100 character limit
- Shows character counter (e.g., "45/100")
- Labeled as "Note (Optional)" to indicate it's not required
- Placeholder text: "Add a note..."

### 4. Timeline Component (HTML)
**File:** `src/app/components/timeline/timeline.component.html`

**Changes Made:**
- Wrapped label in an `entry-content` container
- Added `entry-note` div that displays below the label
- Note only shows if it exists (`*ngIf="occurrence.entry.note"`)

### 5. Timeline Component (SCSS)
**File:** `src/app/components/timeline/timeline.component.scss`

**Changes Made:**
- Added `.entry-content` wrapper with flexbox column layout
- Added `.entry-note` styling:
  - Font size: 12px (11px on tablets, 10px on phones)
  - Color: #9e9e9e (muted gray)
  - Font weight: 400
  - Line height: 1.3
- Updated `.entry-label` to work within the new wrapper
- Added responsive styles for different screen sizes

## User Experience

### Adding a Note
1. User opens the entry dialog (add or edit)
2. Below the label field, user sees an optional "Note" field
3. User can enter up to 100 characters
4. Character counter shows current usage (e.g., "27/100")
5. Note is saved with the entry

### Viewing Notes in Timeline
1. Entries with notes display the note below the label
2. Note appears in a smaller, muted gray font
3. Note text wraps if longer than available space
4. Entries without notes show only the label (no empty space)

## Technical Details

### Data Storage
Entries with notes are stored with:
```typescript
{
  id: string,
  label: string,
  note?: string,  // Optional, max 100 characters
  amount: number,
  type: 'income' | 'expense',
  // ... other fields
}
```

### Styling Specifications
- **Desktop**: 12px font, #9e9e9e color
- **Tablet (≤768px)**: 11px font
- **Phone (≤480px)**: 10px font
- **Gap**: 2px between label and note

## Files Modified
1. `src/app/models/entry.model.ts` - Added note field to Entry interface
2. `src/app/components/entry-dialog/entry-dialog.component.ts` - Form control and save logic
3. `src/app/components/entry-dialog/entry-dialog.component.html` - Note input field
4. `src/app/components/timeline/timeline.component.html` - Note display
5. `src/app/components/timeline/timeline.component.scss` - Note styling
6. `CLAUDE.md` - Updated Data Model preview
7. `plan/phase-7.3.md` - This documentation

## Backward Compatibility
- Note field is optional - existing entries without notes work perfectly
- No migration code needed
- LocalStorage data automatically supports the new optional field
