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
- **Recurring Entries:** Only appear from today forward, never retroactively (one-time entries can be for any date)

## Implementation Phases

| Phase | Focus | Files | Status |
|-------|-------|-------|--------|
| 1 | Project Setup | `phase-1-setup.md` | ✅ Complete |
| 2 | Data Models & Services | `phase-2-models-services.md` | ✅ Complete |
| 3 | Core Timeline UI | `phase-3-timeline-ui.md` | ✅ Complete |
| 4 | Add Entry Feature | `phase-4-add-entry.md` | ✅ Complete |
| 5 | Edit/Delete Features | `phase-5-edit-delete.md` | ✅ Complete |
| 6 | Balance Calculations | `phase-6-balance.md` | ✅ Complete |
| 7 | Initial Balance Setup | `phase-7-initial-balance.md` | ✅ Complete |
| 7.1 | UI Enhancements & Features | `phase-7-initial-balance.md` (section 7.1) | ✅ Complete |
| 7.2 | Filtered Timeline Display | `plan/phase-7.2.md` | ✅ Complete |
| 7.3 | Non-Recurring Entries | `plan/phase-7.3.md` | Pending |
| 7.5 | Balance Indicator & Display Settings | `plan/phase-7.5.md` | ✅ Complete |
| 7.7 | Entry Color Coding | `plan/phase-7.7.md` | ✅ Complete |
| 7.8 | Data Export/Import | `plan/phase-7.8.md` | ✅ Complete |
| 8 | Polish & Responsive | `phase-8-polish.md` | Pending |


#Code Standards
- use onPush change detection always
- always try to use Signals over Observables
- prefer computed() over getters
- avoid unnecessary effect() calls, only use when necessary
- always cleanup takeUntilDestroyed subscriptions for observables
- avoid using allowSignalWrites: true in effect()
- Do not write any tests cases, unit tests, e2e tests, or test files


You can call me as "Samwise" when reply back to me.

After each change, check if there are new eslint warnings or errors and fix them before proceeding. You need to fix the eslint issues as part of the implementation.

When I'm asking any request or change or in plan mode, ask me any clarifying questions if needed before proceeding. Always confirm the requirements with me before starting any implementation.