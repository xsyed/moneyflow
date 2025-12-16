# MoneyStream - Project Plan

## Overview
A responsive web app for tracking recurring income and expenses on a visual timeline, similar to Google Calendar's Schedule view.

## Tech Stack
- Angular 18 with Signals
- Angular Material UI
- LocalStorage for persistence
- No backend/tests

## Key Decisions
- **Edit/Delete:** Users can edit and delete entries
- **Initial Balance:** User sets via settings/prompt
- **Timeline:** Infinite scroll both past and future
- **Weekly/Biweekly:** Based on specific start date
- **Filtering:** Not needed - simple scroll navigation

## Implementation Phases

| Phase | Focus | Files | Status |
|-------|-------|-------|--------|
| 1 | Project Setup | `phase-1-setup.md` | ✅ Complete |
| 2 | Data Models & Services | `phase-2-models-services.md` | ✅ Complete |
| 3 | Core Timeline UI | `phase-3-timeline-ui.md` | ✅ Complete |
| 4 | Add Entry Feature | `phase-4-add-entry.md` | ✅ Complete |
| 5 | Edit/Delete Features | `phase-5-edit-delete.md` | Pending |
| 6 | Balance Calculations | `phase-6-balance.md` | Pending |
| 7 | Initial Balance Setup | `phase-7-initial-balance.md` | Pending |
| 8 | Polish & Responsive | `phase-8-polish.md` | Pending |

## Project Structure (Target)
```
money-stream/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── timeline/
│   │   │   ├── entry-dialog/
│   │   │   ├── balance-display/
│   │   │   └── settings-dialog/
│   │   ├── services/
│   │   │   ├── storage.service.ts
│   │   │   └── entry.service.ts
│   │   ├── models/
│   │   │   └── entry.model.ts
│   │   ├── app.component.ts
│   │   └── app.config.ts
│   └── styles.scss
```

## Data Model (Preview)
```typescript
interface Entry {
  id: string;
  label: string;
  amount: number;
  type: 'income' | 'expense';
  dayOfMonth?: number;        // For monthly repeat
  startDate?: Date;           // For weekly/biweekly
  repeatType: 'monthly' | 'weekly' | 'biweekly';
}
```
