# Phase 3: Core Timeline UI

## Goal
Build the infinite scroll vertical timeline component that displays entries by date.

## Steps

### 3.1 Create Timeline Component
File: `src/app/components/timeline/timeline.component.ts`

Structure:
- Use Angular Material's `cdk-virtual-scroll-viewport` for performance
- Generate date range dynamically as user scrolls
- Group entries by date

### 3.2 Timeline Entry Item
Display format per the spec:
```
10 Dec  ── CIBC CC        +$2,000
   │
21 Dec  ── Sent Money    -$100
   │
```

Use Material components:
- `mat-list` for entry items
- Flexbox for layout (date | connector | label | amount)

### 3.3 Virtual Scroll Setup
```typescript
// Generate dates for a range (e.g., 6 months before and after today)
// Dynamically load more dates as user scrolls

visibleDates = signal<Date[]>([]);
```

### 3.4 Month/Year Headers
- Insert month headers when month changes
- Style: Bold, larger text, sticky positioning optional

### 3.5 Scroll to Today
- On initial load, scroll to today's date
- Optionally add a "Today" button to jump back

### 3.6 Entry Grouping Logic
```typescript
// Computed signal that groups entries by date
entriesByDate = computed(() => {
  // For each visible date, calculate which entries occur on that date
  // Handle monthly, weekly, biweekly logic
});
```

## Material Components Used
- `ScrollingModule` (CDK Virtual Scroll)
- `MatListModule`
- `MatDividerModule`

## Deliverables
- [ ] Timeline component with virtual scroll
- [ ] Entries displayed grouped by date
- [ ] Month/year headers
- [ ] Scroll to today on load
- [ ] Responsive layout
