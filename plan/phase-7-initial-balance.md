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
