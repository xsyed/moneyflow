# Phase 6: Balance Calculations

## Goal
Calculate and display current balance and forecasted balance on hover.

## Steps

### 6.1 Balance Calculation Logic
In `entry.service.ts`, add computed signal:

```typescript
// Calculate balance for any given date
calculateBalanceForDate(targetDate: Date): number {
  // Start from initial balance
  // Add all income entries that occurred before/on targetDate
  // Subtract all expense entries that occurred before/on targetDate
  // Handle recurring entries (generate all occurrences up to targetDate)
}
```

### 6.2 Current Balance Display
Create component: `src/app/components/balance-display/balance-display.component.ts`

- Position: Fixed bottom-right corner
- Show: "Current Balance: $X,XXX"
- Use `computed()` signal that calculates balance for today
- Style: Material card or chip, subtle shadow

### 6.3 Hover Balance (Forecasted)
On timeline date hover:
- Calculate balance as of that date
- Show tooltip or overlay with balance

Implementation options:
1. `matTooltip` on date row (simpler)
2. Custom overlay/popover (more control)

Recommend: Start with `matTooltip`, showing "Balance: $X,XXX"

### 6.4 Balance Formatting
- Use Angular's `CurrencyPipe`
- Positive: Green text
- Negative: Red text
- Format: $1,234.56

### 6.5 Performance Optimization
- Cache balance calculations where possible
- Recalculate only when entries change
- Use `computed()` signals for automatic reactivity

## Material Components Used
- `MatCardModule` (for balance display)
- `MatTooltipModule` (for hover balance)

## Deliverables
- [ ] Balance calculation function
- [ ] Current balance display (bottom-right)
- [ ] Hover to see forecasted balance
- [ ] Color coding for positive/negative
- [ ] Currency formatting
