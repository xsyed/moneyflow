# Phase 5: Edit/Delete Features

## Goal
Enable users to edit or delete existing entries.

## Steps

### 5.1 Entry Context Menu
When user clicks/taps on an entry in the timeline:
- Open a menu or bottom sheet with options:
  - Edit
  - Delete

Use `MatMenu` or `MatBottomSheet` (bottom sheet better for mobile).

### 5.2 Edit Flow
1. User clicks entry → menu appears → clicks "Edit"
2. Open same entry dialog (from Phase 4) pre-filled with entry data
3. Pass entry data to dialog via `MAT_DIALOG_DATA`
4. On save: call `entryService.updateEntry()`

### 5.3 Delete Flow
1. User clicks entry → menu appears → clicks "Delete"
2. Show confirmation dialog (`MatDialog` with simple confirm message)
3. On confirm: call `entryService.deleteEntry()`

### 5.4 Update Entry Dialog
Modify entry dialog to handle edit mode:
```typescript
// Inject data
constructor(@Inject(MAT_DIALOG_DATA) public data: Entry | null)

// If data exists, populate form
// Change save button text: "Add" vs "Update"
```

### 5.5 Visual Feedback
- Show `MatSnackBar` after successful edit/delete
- Brief message: "Entry updated" / "Entry deleted"

## Material Components Used
- `MatMenuModule` or `MatBottomSheetModule`
- `MatSnackBarModule`
- Existing dialog components

## Deliverables
- [ ] Click/tap handler on timeline entries
- [ ] Context menu with Edit/Delete options
- [ ] Edit mode in entry dialog
- [ ] Delete confirmation dialog
- [ ] Snackbar feedback
