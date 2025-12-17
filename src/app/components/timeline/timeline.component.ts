import { Component, OnInit, ViewChild, AfterViewInit, signal, computed, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EntryService } from '../../services/entry.service';
import { Entry } from '../../models/entry.model';
import { generateOccurrences } from '../../utils/date.utils';
import { EntryActionsSheetComponent, EntryAction } from '../entry-actions-sheet/entry-actions-sheet.component';
import { EntryDialogComponent } from '../entry-dialog/entry-dialog.component';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DeleteOptionsDialogComponent, DeleteOption } from '../delete-options-dialog/delete-options-dialog.component';
import { UpdateOptionsDialogComponent, UpdateOption } from '../update-options-dialog/update-options-dialog.component';

interface TimelineDate {
  date: Date;
  dateKey: string; // YYYY-MM-DD for comparison
  displayDate: string; // "10 Dec"
  isMonthStart: boolean;
  isMonthEnd: boolean;
  monthYear: string; // "December 2024" for headers
  nextMonthYear: string; // "January 2025" for next month header
  entries: EntryOccurrence[];
  showMonthHeader: boolean; // Show month header before this day
  daysSkipped?: number; // Number of days skipped before this row
  isToday: boolean; // Cache today check for filtering

  // Pre-computed display values for performance
  balance: number;
  balanceFormatted: string;
  balanceTooltip: string;
  balanceTooltipClass: string;
  isCurrentMonth: boolean;
  monthEndDateFormatted?: string;
}

interface EntryOccurrence {
  entry: Entry;
  date: Date;

  // Pre-computed display value for performance
  amountFormatted: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatBottomSheetModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  // Signals for reactive data
  private startDate = signal<Date>(this.getDateMonthsAgo(6));
  private endDate = signal<Date>(this.getDateMonthsAhead(6));

  // Cached timeline segments for incremental generation
  private pastDates = signal<TimelineDate[]>([]);
  private coreDates = signal<TimelineDate[]>([]);
  private futureDates = signal<TimelineDate[]>([]);

  // Computed timeline dates - combines all segments
  timelineDates = computed<TimelineDate[]>(() => {
    return [...this.pastDates(), ...this.coreDates(), ...this.futureDates()];
  });

  todayIndex = computed(() => {
    const dates = this.timelineDates();
    const todayKey = this.formatDateKey(new Date());
    return dates.findIndex(d => d.dateKey === todayKey);
  });

  // Compute average item size dynamically based on actual content
  estimateAverageItemSize = computed(() => {
    const dates = this.timelineDates();
    if (dates.length === 0) return 60;

    const totalEstimated = dates.reduce((sum, date) => {
      let size = 60; // Base date row height

      // Add skip indicator height if present
      if (date.daysSkipped && date.daysSkipped > 0) {
        size += 24;
      }

      // Add height for each entry (~40px per entry)
      size += date.entries.length * 40;

      // Add height for month-end balance and header
      if (date.isMonthEnd) {
        size += 60; // month-end balance row
        size += 50; // month header
      }

      return sum + size;
    }, 0);

    return Math.round(totalEstimated / dates.length);
  });

  // Track the current visible date range
  private currentVisibleIndex = signal<number>(0);

  // Mobile detection for performance optimizations
  isMobile = signal<boolean>(false);

  // Show "Scroll to Today" button only if we're more than 1 month away from today
  showScrollToToday = computed(() => {
    const visibleIndex = this.currentVisibleIndex();
    const todayIdx = this.todayIndex();

    if (todayIdx < 0) return false; // Today not in range

    // Calculate difference in days (approximate 30 days = 1 month)
    const daysDifference = Math.abs(visibleIndex - todayIdx);
    return daysDifference > 30;
  });

  private bottomSheet = inject(MatBottomSheet);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  constructor(public entryService: EntryService) {
    // Watch for entry changes and regenerate all segments
    effect(() => {
      const entries = this.entryService.entries();
      // Trigger regeneration when entries change
      this.regenerateAllSegments();
    });
  }

  ngOnInit(): void {
    // Detect mobile for performance optimizations
    this.isMobile.set(window.innerWidth <= 768);

    // Initialize core timeline (today ±6 months)
    this.initializeCoreTimeline();
  }

  ngAfterViewInit(): void {
    // Scroll to today after view is initialized
    setTimeout(() => {
      this.scrollToToday();
      // Set initial visible index
      const todayIdx = this.todayIndex();
      if (todayIdx >= 0) {
        this.currentVisibleIndex.set(todayIdx);
      }
    }, 100);
  }

  scrollToToday(): void {
    const index = this.todayIndex();
    if (index >= 0 && this.viewport) {
      this.viewport.scrollToIndex(index, 'smooth');
    }
  }

  onScroll(): void {
    if (!this.viewport) return;

    const scrollIndex = this.viewport.getRenderedRange().start;
    const totalItems = this.timelineDates().length;

    // Update current visible index for "Scroll to Today" button visibility
    this.currentVisibleIndex.set(scrollIndex);

    // Load more when within 20% of edges (adaptive threshold)
    const threshold = Math.max(10, Math.floor(totalItems * 0.2));

    // Load more past dates if scrolling near the top
    if (scrollIndex < threshold) {
      this.loadMorePast();
    }

    // Load more future dates if scrolling near the bottom
    if (scrollIndex > totalItems - threshold) {
      this.loadMoreFuture();
    }
  }

  private initializeCoreTimeline(): void {
    const start = this.getDateMonthsAgo(6);
    const end = this.getDateMonthsAhead(6);
    const entries = this.entryService.entries();

    const dates = this.generateTimelineDates(start, end, entries);
    this.coreDates.set(dates);
    this.startDate.set(start);
    this.endDate.set(end);
  }

  private regenerateAllSegments(): void {
    const start = this.startDate();
    const end = this.endDate();
    const entries = this.entryService.entries();

    // Split into segments
    const coreStart = this.getDateMonthsAgo(6);
    const coreEnd = this.getDateMonthsAhead(6);

    // Generate past segment (if start is before core)
    const pastDates = start < coreStart
      ? this.generateTimelineDates(start, coreStart, entries)
      : [];

    // Generate core segment (today ±6 months)
    const coreDates = this.generateTimelineDates(coreStart, coreEnd, entries);

    // Generate future segment (if end is after core)
    const futureDates = end > coreEnd
      ? this.generateTimelineDates(coreEnd, end, entries)
      : [];

    this.pastDates.set(pastDates);
    this.coreDates.set(coreDates);
    this.futureDates.set(futureDates);
  }

  private loadMorePast(): void {
    const currentStart = this.startDate();
    const newStart = this.getDateMonthsBeforeDate(currentStart, 3);

    // Generate only the NEW 3 months
    const entries = this.entryService.entries();
    const newDates = this.generateTimelineDates(newStart, currentStart, entries);

    // Prepend to past cache
    this.pastDates.update(past => [...newDates, ...past]);
    this.startDate.set(newStart);
  }

  private loadMoreFuture(): void {
    const currentEnd = this.endDate();
    const newEnd = this.getDateMonthsAfterDate(currentEnd, 3);

    // Generate only the NEW 3 months
    const entries = this.entryService.entries();
    const newDates = this.generateTimelineDates(currentEnd, newEnd, entries);

    // Append to future cache
    this.futureDates.update(future => [...future, ...newDates]);
    this.endDate.set(newEnd);
  }

  private generateTimelineDates(
    startDate: Date,
    endDate: Date,
    entries: Entry[]
  ): TimelineDate[] {
    const timelineDates: TimelineDate[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Pre-fetch balanceMap for performance
    const balanceMap = this.entryService.balanceMap();
    const todayKey = this.formatDateKey(new Date());
    const currentMonthNum = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let previousMonth = -1;

    while (currentDate <= end) {
      const dateKey = this.formatDateKey(currentDate);
      const displayDate = this.formatDisplayDate(currentDate);
      const currentMonth = currentDate.getMonth();
      const isMonthStart = currentMonth !== previousMonth;
      const monthYear = this.formatMonthYear(currentDate);

      // Check if this is the last day of the month
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const isMonthEnd = nextDay.getMonth() !== currentMonth;

      // Calculate next month year for header
      const nextMonthYear = this.formatMonthYear(nextDay);

      // Find all entries that occur on this date (already includes amountFormatted)
      const entriesForDate = this.getEntriesForDate(currentDate, entries);

      // PRE-COMPUTE: Balance and formatted values
      const balance = balanceMap.get(dateKey) ?? this.entryService.settings()?.initialBalance ?? 0;
      const balanceFormatted = this.entryService.formatCurrency(balance);
      const isToday = dateKey === todayKey;
      const isCurrentMonthFlag = nextDay.getMonth() === currentMonthNum && nextDay.getFullYear() === currentYear;

      timelineDates.push({
        date: new Date(currentDate),
        dateKey,
        displayDate,
        isMonthStart,
        isMonthEnd,
        monthYear,
        nextMonthYear,
        entries: entriesForDate,
        showMonthHeader: false,
        daysSkipped: 0,
        isToday: false,
        // Pre-computed display values
        balance,
        balanceFormatted,
        balanceTooltip: `Balance: ${balanceFormatted}`,
        balanceTooltipClass: balance >= 0 ? 'positive-balance' : 'negative-balance',
        isCurrentMonth: isCurrentMonthFlag,
        monthEndDateFormatted: isMonthEnd ? this.formatMonthEndDate(currentDate) : undefined
      });

      previousMonth = currentMonth;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // PHASE 2: Filter to only relevant dates
    return this.filterRelevantDates(timelineDates);
  }

  private filterRelevantDates(allDates: TimelineDate[]): TimelineDate[] {
    const todayKey = this.formatDateKey(new Date());
    const filtered: TimelineDate[] = [];

    for (let i = 0; i < allDates.length; i++) {
      const current = allDates[i];
      const isToday = current.dateKey === todayKey;
      const hasEntries = current.entries.length > 0;
      const isMonthEnd = current.isMonthEnd;

      // Include if: today, has entries, or month-end
      if (isToday || hasEntries || isMonthEnd) {
        // Calculate days skipped since last visible date
        let daysSkipped = 0;
        if (filtered.length > 0) {
          const lastDate = filtered[filtered.length - 1].date;
          const currentDate = current.date;
          const daysDiff = Math.floor(
            (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          daysSkipped = daysDiff - 1;
        }

        filtered.push({
          ...current,
          isToday,
          daysSkipped,
          showMonthHeader: false
        });
      }
    }

    return filtered;
  }

  private getEntriesForDate(date: Date, entries: Entry[]): EntryOccurrence[] {
    const occurrences: EntryOccurrence[] = [];
    const dateKey = this.formatDateKey(date);

    // Create a date range for just this single day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    for (const entry of entries) {
      const entryOccurrences = generateOccurrences(
        entry,
        dayStart,
        dayEnd
      );

      for (const occurrenceDate of entryOccurrences) {
        const occurrenceKey = this.formatDateKey(occurrenceDate);
        if (occurrenceKey === dateKey) {
          occurrences.push({
            entry,
            date: occurrenceDate,
            amountFormatted: this.formatAmountStatic(entry)
          });
        }
      }
    }

    // Filter out recurring entries that have an override for this date
    const filteredOccurrences = occurrences.filter(occurrence => {
      // Skip deletion markers themselves
      if (occurrence.entry.isDeleted) return false;

      // For recurring entries, check if deleted
      if (occurrence.entry.repeatType !== 'once') {
        // Check for deletion marker
        const hasDeleteMarker = entries.some(
          e => e.isDeleted === true &&
               e.parentEntryId === occurrence.entry.id &&
               e.specificDate === dateKey
        );
        if (hasDeleteMarker) return false;

        // Look for a one-time entry with this entry's ID as parentEntryId
        const hasOverride = occurrences.some(
          other =>
            other.entry.repeatType === 'once' &&
            !other.entry.isDeleted &&
            other.entry.parentEntryId === occurrence.entry.id &&
            this.formatDateKey(other.date) === dateKey
        );
        // If there's an override for this date, exclude the recurring entry
        return !hasOverride;
      }
      // Keep all one-time entries (except deletion markers, already filtered above)
      return true;
    });

    // Sort by amount (income first, then expenses)
    return filteredOccurrences.sort((a, b) => {
      if (a.entry.type !== b.entry.type) {
        return a.entry.type === 'income' ? -1 : 1;
      }
      return b.entry.amount - a.entry.amount;
    });
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDisplayDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  }

  private formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatMonthEndDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getBalanceForDate(date: Date): number {
    return this.entryService.getBalanceForDate(date);
  }

  formatCurrency(amount: number): string {
    return this.entryService.formatCurrency(amount);
  }

  private getDateMonthsAgo(months: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private getDateMonthsAhead(months: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private getDateMonthsBeforeDate(date: Date, months: number): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - months);
    return newDate;
  }

  private getDateMonthsAfterDate(date: Date, months: number): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  }

  formatAmount(entry: Entry): string {
    const sign = entry.type === 'income' ? '+' : '-';
    return `${sign}$${entry.amount.toLocaleString()}`;
  }

  private formatAmountStatic(entry: Entry): string {
    const sign = entry.type === 'income' ? '+' : '-';
    return `${sign}$${entry.amount.toLocaleString()}`;
  }

  isToday(dateKey: string): boolean {
    return dateKey === this.formatDateKey(new Date());
  }

  isCurrentMonth(date: Date): boolean {
    const now = new Date();
    const nextMonth = new Date(date);
    nextMonth.setDate(nextMonth.getDate() + 1); // Get the next day (which is the first day of next month)

    return nextMonth.getMonth() === now.getMonth() &&
           nextMonth.getFullYear() === now.getFullYear();
  }

  trackByDateKey(_index: number, item: TimelineDate): string {
    return item.dateKey;
  }

  onDateRowClick(date: Date, event: Event): void {
    // Open add entry dialog with pre-filled date
    const dialogRef = this.dialog.open(EntryDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        initialDate: date
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'added') {
        this.snackBar.open('Entry created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  onEntryClick(entry: Entry, occurrenceDate: Date, event: Event): void {
    // Stop propagation to prevent triggering the date row click
    event.stopPropagation();

    const bottomSheetRef = this.bottomSheet.open(EntryActionsSheetComponent, {
      data: entry
    });

    bottomSheetRef.afterDismissed().subscribe((action: EntryAction | undefined) => {
      if (action === 'edit') {
        this.openEditDialog(entry, occurrenceDate);
      } else if (action === 'delete') {
        this.openDeleteConfirmation(entry, occurrenceDate);
      }
    });
  }

  private openEditDialog(entry: Entry, occurrenceDate: Date): void {
    // Check if this is a recurring entry
    const isRecurring = entry.repeatType !== 'once';

    if (isRecurring) {
      // Show update options dialog for recurring entries
      const optionsDialogRef = this.dialog.open(UpdateOptionsDialogComponent, {
        width: '500px',
        maxWidth: '90vw'
      });

      optionsDialogRef.afterClosed().subscribe((option: UpdateOption | null) => {
        if (option) {
          this.openEntryEditForm(entry, occurrenceDate, option);
        }
      });
    } else {
      // For one-time entries, just open the edit dialog
      this.openEntryEditForm(entry, occurrenceDate, null);
    }
  }

  private openEntryEditForm(entry: Entry, occurrenceDate: Date, updateOption: UpdateOption | null): void {
    const dialogRef = this.dialog.open(EntryDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        entry,
        occurrenceDate,
        updateOption
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'updated') {
        this.snackBar.open('Entry updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      } else if (result && result.action === 'added') {
        this.snackBar.open('Entry created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  private openDeleteConfirmation(entry: Entry, occurrenceDate: Date): void {
    const isRecurring = entry.repeatType !== 'once';

    if (isRecurring) {
      // Show delete options dialog for recurring entries
      const optionsDialogRef = this.dialog.open(DeleteOptionsDialogComponent, {
        width: '500px',
        maxWidth: '90vw'
      });

      optionsDialogRef.afterClosed().subscribe((option: DeleteOption | null) => {
        if (option === 'this-only') {
          this.entryService.deleteSingleOccurrence(entry.id, occurrenceDate);
          this.snackBar.open('Occurrence deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        } else if (option === 'all-occurrences') {
          this.deleteAllOccurrences(entry);
        }
      });
    } else {
      // One-time entry - show simple confirmation
      this.deleteAllOccurrences(entry);
    }
  }

  private deleteAllOccurrences(entry: Entry): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '400px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.entryService.deleteEntry(entry.id);
        this.snackBar.open('Entry deleted successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  getBalanceTooltip(date: Date): string {
    const balance = this.entryService.getBalanceForDate(date);
    return `Balance: ${this.entryService.formatCurrency(balance)}`;
  }

  getBalanceTooltipClass(date: Date): string {
    const balance = this.entryService.getBalanceForDate(date);
    return balance >= 0 ? 'positive-balance' : 'negative-balance';
  }
}
