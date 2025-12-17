# Phase 7.2: Filtered Timeline Display

## Overview
This phase optimizes the timeline to only show relevant days, dramatically improving usability and performance by reducing visual clutter and the number of rows rendered.

## Goals
- Show only days that matter: today, days with entries, and month-end days
- Add visual indicators showing when days are skipped
- Display month headers before the first entry of each month
- Improve performance by reducing rendered rows from ~4,380 to ~100-300
- Maintain all existing functionality (scrolling, balance display, infinite scroll)

## Technical Implementation

### 1. Extended TimelineDate Interface
Added three new properties to support filtered display:
- `showMonthHeader`: Boolean indicating if month header should appear before this day
- `daysSkipped`: Number of days skipped since the previous visible day (for visual indicator)
- `isToday`: Cached today check for efficient filtering

### 2. Two-Phase Filtering System
- **Phase 1 (Generate)**: Generate all dates between startDate and endDate (existing logic)
- **Phase 2 (Filter)**: Filter to only include:
  - Current day (always visible, even without entries)
  - Days with entries (income or expense transactions)
  - Month-end days (for balance tracking)

### 3. Visual Enhancements
- **Skip Indicators**: Dashed line with day count when days are skipped between entries
- **Smart Month Headers**: Appear before the first entry of each new month
- **Month-End Balances**: Always displayed for financial tracking

### 4. Performance Optimizations
- Adaptive infinite scroll thresholds (percentage-based instead of fixed)
- Reduced virtual scroll item count
- Efficient filtering using computed signals

## Files Modified

1. **src/app/components/timeline/timeline.component.ts**
   - Extended `TimelineDate` interface
   - Added `filterRelevantDates()` method
   - Updated `generateTimelineDates()` to apply filtering
   - Updated `onScroll()` with adaptive thresholds

2. **src/app/components/timeline/timeline.component.html**
   - Added skip indicator component before date rows
   - Updated month header to use `showMonthHeader` property
   - Removed old month header after month-end balance

3. **src/app/components/timeline/timeline.component.scss**
   - Added `.skip-indicator` styles
   - Added `.skip-line` for dashed line visual
   - Added `.skip-label` for day count display
   - Included mobile responsive adjustments

## Key Features

### Skip Indicators
When days are skipped between entries, a subtle visual indicator appears showing:
- Dashed lines on both sides
- Number of days skipped in the middle
- Responsive design for mobile devices

### Smart Month Headers
Month headers now appear intelligently:
- Only shown before the first entry of each month
- Not duplicated after month-end balances
- Sticky positioning for easy navigation

### Always-Visible Today
The current day is always visible in the timeline, even if it has no entries, ensuring users always have a reference point.

### Month-End Balances
Month-end balance rows are always shown, even if that day has no entries, providing consistent financial tracking points.

## Edge Cases Handled

1. Empty timeline with no entries - shows only today
2. Today with no entries - shows with empty connector
3. Sparse entries (months apart) - skip indicators show large gaps
4. Dense entries (consecutive days) - minimal skip indicators
5. First visible day - no skip indicator (daysSkipped = 0)

## Performance Impact

**Before**: ~4,380 virtual scroll items (365 days × 12 months)
**After**: ~100-300 virtual scroll items (varies by entry density)

**Benefits**:
- Faster rendering
- Reduced memory usage
- Smoother scrolling
- Improved user experience

## User Experience

Users can now:
- Quickly scan through only relevant dates
- See clear visual indicators when days are skipped
- Maintain context with month headers and balances
- Navigate efficiently with fewer scroll operations
- Always find today's date as a reference point

## Future Enhancements (Not Implemented)
- Optional "Show All Days" toggle for users who prefer full calendar view
- Custom filtering options (e.g., show weekends, show week starts)
- Date range selection to expand/collapse specific periods
