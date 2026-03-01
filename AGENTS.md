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

## Code Standards
- use onPush change detection always
- always try to use Signals over Observables
- prefer computed() over getters
- avoid unnecessary effect() calls, only use when necessary
- always cleanup takeUntilDestroyed subscriptions for observables
- avoid using allowSignalWrites: true in effect()
- Do not write any tests cases, unit tests, e2e tests, or test files

You can call me as "Samwise" when replying back to me.

After each change, check if there are new eslint warnings or errors and fix them before proceeding. You need to fix the eslint issues as part of the implementation.

When I'm asking any request or change or in plan mode, ask me any clarifying questions if needed before proceeding. Always confirm the requirements with me before starting any implementation.