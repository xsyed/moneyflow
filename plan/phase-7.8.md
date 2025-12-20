# Phase 7.8: Data Export/Import Feature

## Overview
Adds export and import functionality to MoneyStream, allowing users to backup and restore their data (entries + settings) via JSON files accessible from the Settings Dialog.

## Features

### Export
- Exports all entries and settings to a JSON file
- Filename format: `moneystream-export-YYYY-MM-DD.json` (includes date)
- Clean data structure (no metadata)
- One-click download from Settings Dialog

### Import
- Imports JSON file and replaces all existing data
- Strict validation - rejects invalid or partial data
- Requires confirmation before clearing existing data
- Only accepts files exported from the app
- Displays clear error messages for invalid imports

## Implementation Details

### 1. StorageService (`src/app/services/storage.service.ts`)

**Added ExportData Interface:**
```typescript
export interface ExportData {
  entries: Entry[];
  settings: AppSettings;
}
```

**Added Methods:**
- `exportData(): ExportData` - Exports entries and settings from localStorage
- `importData(data: ExportData): void` - Validates and imports data to localStorage

**Validation Rules:**
- Data must be an object with `entries` and `settings` properties
- `entries` must be an array
- `settings` must be an object
- Each entry must have: id, label, amount, type, repeatType, createdAt
- Settings must have: initialBalance, balanceSetDate
- Throws descriptive errors for validation failures

### 2. EntryService (`src/app/services/entry.service.ts`)

**Added Methods:**
- `exportData(): ExportData` - Wrapper for StorageService.exportData()
- `importData(data: ExportData): void` - Imports data and reloads signals

### 3. SettingsDialog Component

**Files Modified:**
- `src/app/components/settings-dialog/settings-dialog.component.ts`
- `src/app/components/settings-dialog/settings-dialog.component.html`
- `src/app/components/settings-dialog/settings-dialog.component.scss`

**New Imports:**
- MatDialog for dialogs
- MatIconModule for icons
- ExportData interface

**New Methods:**
- `onExport()` - Creates JSON file and triggers download
- `onImport()` - Opens file picker, validates, and imports data
- `formatDate(date: Date): string` - Formats date as YYYY-MM-DD
- `showErrorDialog(message: string): void` - Displays error messages

**UI Changes:**
- Added "Data Management" section with Export/Import buttons
- Buttons display Material icons (download/upload)
- Styled to match existing Display Options section
- Clear hint text for users

### 4. Export Data Structure

```json
{
  "entries": [
    {
      "id": "1234567890-abc123",
      "label": "Salary",
      "amount": 5000,
      "type": "income",
      "dayOfMonth": 1,
      "repeatType": "monthly",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "color": "#00A5E3"
    }
  ],
  "settings": {
    "initialBalance": 1000,
    "balanceSetDate": "2024-01-01T00:00:00.000Z",
    "showDaysIndicator": true,
    "showBalanceIndicator": true
  }
}
```

## User Experience

### Export Flow
1. User opens Settings Dialog (gear icon)
2. Scrolls to "Data Management" section
3. Clicks "Export Data" button
4. Browser downloads `moneystream-export-YYYY-MM-DD.json` file

### Import Flow
1. User opens Settings Dialog (gear icon)
2. Scrolls to "Data Management" section
3. Clicks "Import Data" button
4. File picker opens (accepts .json files only)
5. User selects exported JSON file
6. Confirmation dialog appears: "This will delete all your existing data. Continue?"
7. If confirmed:
   - Data is validated
   - If valid: Data is imported, UI reloads, success message shown, dialog closes
   - If invalid: Error message displayed with specific reason

## Error Messages

- **Invalid file format:** "Invalid file format. Please select a valid MoneyStream export file."
- **Missing data:** "Import file must contain both entries and settings data."
- **Invalid entries:** "Import file contains invalid entry data."
- **Invalid settings:** "Import file contains invalid settings data."
- **File read error:** "Could not read the selected file. Please try again."
- **JSON parse error:** "Invalid JSON file. Please select a valid export file."
- **Export error:** "Cannot export: Settings not found" (if no settings exist)

## Technical Notes

### File Download Implementation
- Uses Blob API to create JSON file
- Creates temporary download link and triggers click
- Cleans up URL after download

### File Upload Implementation
- Creates hidden file input element
- Accepts only .json files
- Uses FileReader API to read file contents
- Parses JSON and validates before importing

### Confirmation/Error Dialogs
- Uses browser's native `confirm()` for import confirmation
- Uses browser's native `alert()` for error messages and success notifications
- Simple and reliable across all browsers

### Data Validation
- Strict validation ensures data integrity
- Checks both structure and required fields
- Type checking for all critical properties
- Rejects partial imports (must have both entries and settings)

## Edge Cases Handled

1. **Empty entries:** Allows export with no entries (just settings)
2. **File picker cancel:** No action taken if user cancels file selection
3. **Import cancel:** No changes made if user cancels confirmation
4. **Malformed JSON:** Clear error message for invalid JSON syntax
5. **Missing optional fields:** Optional fields (note, color, etc.) are not validated
6. **Export without settings:** Throws error (cannot export without initial setup)

## Files Modified

1. `src/app/services/storage.service.ts` - Added export/import methods with validation
2. `src/app/services/entry.service.ts` - Added wrapper methods
3. `src/app/components/settings-dialog/settings-dialog.component.ts` - Added UI handlers
4. `src/app/components/settings-dialog/settings-dialog.component.html` - Added Data Management section
5. `src/app/components/settings-dialog/settings-dialog.component.scss` - Added section styles
6. `CLAUDE.md` - Added Phase 7.8 entry

## Success Criteria

✅ Export creates properly formatted JSON file with date in filename
✅ Import validates data structure strictly
✅ Import shows confirmation before replacing data
✅ Import reloads UI with new data on success
✅ Errors are displayed clearly to user
✅ Export/Import buttons are easily accessible in Settings
✅ No eslint warnings
✅ CLAUDE.md updated with Phase 7.8
✅ Detailed phase-7.8.md file created

## Status
✅ Complete
