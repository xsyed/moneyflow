# Phase 4: Add Entry Feature

## Goal
Create the dialog/form for adding new income or expense entries.

## Steps

### 4.1 Create Entry Dialog Component
File: `src/app/components/entry-dialog/entry-dialog.component.ts`

Use `MatDialog` with a form inside.

### 4.2 Form Fields
Using Angular Material form components:

1. **Label** - `mat-form-field` with `matInput`
   - Required, text input

2. **Amount** - `mat-form-field` with `matInput` type="number"
   - Required, positive number

3. **Type** - `mat-button-toggle-group`
   - Options: Income | Expense
   - Default: Expense

4. **Repeat Type** - `mat-select`
   - Options: Monthly | Weekly | Biweekly
   - Default: Monthly

5. **Day/Date Selection** (conditional):
   - If Monthly: `mat-select` with days 1-31
   - If Weekly/Biweekly: `mat-datepicker` to pick start date

### 4.3 Form Validation
- Label: required, min 1 char
- Amount: required, > 0
- Type: required
- Repeat: required
- Day/Date: required based on repeat type

### 4.4 Add Button (FAB)
In main app component:
- Position: Top-left (per spec) or use FAB bottom-right
- `mat-fab` with `+` icon
- Opens entry dialog on click

### 4.5 Dialog Actions
- Cancel button
- Save button (disabled until form valid)
- On save: call `entryService.addEntry()` and close dialog

## Material Components Used
- `MatDialogModule`
- `MatFormFieldModule`
- `MatInputModule`
- `MatButtonToggleModule`
- `MatSelectModule`
- `MatDatepickerModule`
- `MatButtonModule`
- `MatIconModule`

## Deliverables
- [ ] Entry dialog component
- [ ] Form with all required fields
- [ ] Conditional day/date picker
- [ ] Validation
- [ ] FAB button to trigger dialog
- [ ] Entry saved to service/storage
