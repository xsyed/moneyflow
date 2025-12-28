import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ElementRef, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EntryService } from '../../services/entry.service';
import { ThemeService } from '../../services/theme.service';
import { Entry } from '../../models/entry.model';
import { generateOccurrences } from '../../utils/date.utils';
import { isDarkColor, getDarkModeColor } from '../../utils/color.utils';
import { EntryActionsSheetComponent, EntryAction } from '../entry-actions-sheet/entry-actions-sheet.component';
import { EntryDialogComponent } from '../entry-dialog/entry-dialog.component';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DeleteOptionsDialogComponent, DeleteOption } from '../delete-options-dialog/delete-options-dialog.component';
import { UpdateOptionsDialogComponent, UpdateOption } from '../update-options-dialog/update-options-dialog.component';

interface TimelineDate {
  date: Date;
  dateKey: string; // YYYY-MM-DD for comparison
  displayDate: { day: string; month: string; weekday: string }; // Formatted date parts
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

  // Balance indicator values
  showBalanceIndicator: boolean;
  previousDayBalance: number;
  balanceChange: 'up' | 'down' | 'none';

  // Month-end balance arrow
  monthEndArrow: 'up' | 'down' | 'none';
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
export class TimelineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('topSentinel') topSentinel!: ElementRef<HTMLDivElement>;
  @ViewChild('bottomSentinel') bottomSentinel!: ElementRef<HTMLDivElement>;

  // IntersectionObserver for infinite scroll
  private topObserver?: IntersectionObserver;
  private bottomObserver?: IntersectionObserver;
  private loadingMore = false;

  // Signals for reactive data
  private startDate = signal<Date>(this.getDateMonthsAgo(6));
  private endDate = signal<Date>(this.getDateMonthsAhead(6));

  // Stable core range (doesn't shift with time)
  private coreStartDate = signal<Date>(this.getDateMonthsAgo(6));
  private coreEndDate = signal<Date>(this.getDateMonthsAhead(6));

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

  // Check if there are any entries in the entire timeline
  hasAnyEntries = computed(() => {
    const dates = this.timelineDates();
    return dates.some(d => d.entries.length > 0);
  });

  // Track the current visible date range
  private currentVisibleIndex = signal<number>(0);

  // Mobile detection for performance optimizations
  isMobile = signal<boolean>(false);

  // Flag to track initialization (plain boolean to avoid signal tracking in effect)
  private initialized = false;

  // Show "Scroll to Today" button only if we're more than 1 month away from today
  showScrollToToday = computed(() => {
    const visibleIndex = this.currentVisibleIndex();
    const todayIdx = this.todayIndex();

    if (todayIdx < 0) return false; // Today not in range

    // Calculate difference in months
    const monthsDifference = Math.abs(visibleIndex - todayIdx);
    return monthsDifference > 1;
  });

  // Show weekday labels based on user setting
  showWeekday = computed(() => this.entryService.showWeekday());

  private bottomSheet = inject(MatBottomSheet);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    public entryService: EntryService,
    public themeService: ThemeService
  ) {
    // Track changes to both entries and settings using RxJS
    combineLatest([
      toObservable(this.entryService.entries),
      toObservable(this.entryService.settings)
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        // Only regenerate if already initialized
        if (this.initialized) {
          this.regenerateAllSegments();
        }
      });
  }

  ngOnInit(): void {
    // Detect mobile for performance optimizations
    this.isMobile.set(window.innerWidth <= 768);

    // Set stable core range (doesn't shift with time)
    this.coreStartDate.set(this.getDateMonthsAgo(6));
    this.coreEndDate.set(this.getDateMonthsAhead(6));

    // Initialize core timeline (today ±6 months)
    this.initializeCoreTimeline();

    // Mark as initialized so the effect can start regenerating on entry changes
    this.initialized = true;
  }

  ngAfterViewInit(): void {
    // Setup observers immediately
    setTimeout(() => {
      this.setupIntersectionObservers();
      // Delay scroll to ensure content is fully rendered
      setTimeout(() => {
        this.scrollToToday();
      }, 500);
    }, 100);
  }

  ngOnDestroy(): void {
    this.topObserver?.disconnect();
    this.bottomObserver?.disconnect();
  }

  scrollToToday(): void {
    const index = this.todayIndex();
    if (index >= 0 && this.scrollContainer) {
      const container = this.scrollContainer.nativeElement;
      const items = container.querySelectorAll('.timeline-item');
      if (items[index]) {
        const itemElement = items[index] as HTMLElement;
        const itemRect = itemElement.getBoundingClientRect();

        // Calculate the scroll position to center the item in the viewport
        const scrollOffset = itemElement.offsetTop - (container.clientHeight / 2) + (itemRect.height / 2);

        // Scroll within the container only
        container.scrollTo({
          top: scrollOffset,
          behavior: 'smooth'
        });
      }
    }
  }

  onScroll(): void {
    if (!this.scrollContainer) return;

    const container = this.scrollContainer.nativeElement;
    const items = container.querySelectorAll('.timeline-item');

    // Find the first visible item to update current visible index
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement;
      const rect = item.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (rect.top >= containerRect.top && rect.top <= containerRect.bottom) {
        this.currentVisibleIndex.set(i);
        break;
      }
    }
  }

  private setupIntersectionObservers(): void {
    const options: IntersectionObserverInit = {
      root: this.scrollContainer.nativeElement,
      rootMargin: '100px',
      threshold: 0
    };

    // Top observer - load past dates
    this.topObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loadingMore) {
        this.loadingMore = true;
        this.loadMorePast();
        setTimeout(() => this.loadingMore = false, 200);
      }
    }, options);
    this.topObserver.observe(this.topSentinel.nativeElement);

    // Bottom observer - load future dates
    this.bottomObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loadingMore) {
        this.loadingMore = true;
        this.loadMoreFuture();
        setTimeout(() => this.loadingMore = false, 200);
      }
    }, options);
    this.bottomObserver.observe(this.bottomSentinel.nativeElement);
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

    // Use STABLE core range (doesn't shift with time)
    const coreStart = this.coreStartDate();
    const coreEnd = this.coreEndDate();

    // Generate past segment (if start is before core)
    const pastDates = start < coreStart
      ? this.generateTimelineDates(start, coreStart, entries)
      : [];

    // Generate core segment (stable ±6 months range)
    const coreDates = this.generateTimelineDates(coreStart, coreEnd, entries);

    // Generate future segment (if end is after core)
    const futureDates = end > coreEnd
      ? this.generateTimelineDates(coreEnd, end, entries)
      : [];

    this.pastDates.set(pastDates);
    this.coreDates.set(coreDates);
    this.futureDates.set(futureDates);

    // CRITICAL: Trigger change detection for OnPush
    this.cdr.markForCheck();
  }

  private loadMorePast(): void {
    const currentStart = this.startDate();
    const newStart = this.getDateMonthsBeforeDate(currentStart, 3);

    const currentScrollHeight = this.scrollContainer?.nativeElement.scrollHeight || 0;

    // Generate only the NEW 3 months
    const entries = this.entryService.entries();
    const newDates = this.generateTimelineDates(newStart, currentStart, entries);

    // Prepend to past cache
    this.pastDates.update(past => [...newDates, ...past]);
    this.startDate.set(newStart);

    // Maintain scroll position after prepending
    setTimeout(() => {
      if (this.scrollContainer) {
        const newScrollHeight = this.scrollContainer.nativeElement.scrollHeight;
        const heightDiff = newScrollHeight - currentScrollHeight;
        this.scrollContainer.nativeElement.scrollTop += heightDiff;
      }
    }, 0);
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

  private getPreviousDayBalance(dateKey: string, balanceMap: Map<string, number>): number {
    const date = new Date(dateKey);
    date.setDate(date.getDate() - 1);
    const prevKey = this.formatDateKey(date);
    return balanceMap.get(prevKey) ?? this.entryService.settings()?.initialBalance ?? 0;
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
    const currentMonthNum = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const showBalanceIndicatorSetting = this.entryService.showBalanceIndicator();

    let previousMonth = -1;
    let previousMonthEndBalance: number | null = null;

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
      const isCurrentMonthFlag = nextDay.getMonth() === currentMonthNum && nextDay.getFullYear() === currentYear;

      // Compute balance indicator data (only if setting enabled for performance)
      const previousDayBalance = showBalanceIndicatorSetting
        ? this.getPreviousDayBalance(dateKey, balanceMap)
        : 0;
      const balanceChange: 'up' | 'down' | 'none' =
        balance > previousDayBalance ? 'up' :
        balance < previousDayBalance ? 'down' : 'none';

      // Compute month-end arrow (compare with previous month's ending balance)
      let monthEndArrow: 'up' | 'down' | 'none' = 'none';
      if (isMonthEnd && previousMonthEndBalance !== null) {
        monthEndArrow = balance > previousMonthEndBalance ? 'up' :
                        balance < previousMonthEndBalance ? 'down' : 'none';
      }

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
        monthEndDateFormatted: isMonthEnd ? this.formatMonthEndDate(currentDate) : undefined,
        // Balance indicator values
        showBalanceIndicator: false, // Will be set in filterRelevantDates
        previousDayBalance,
        balanceChange,
        // Month-end balance arrow
        monthEndArrow
      });

      // Track previous month-end balance for next iteration
      if (isMonthEnd) {
        previousMonthEndBalance = balance;
      }

      previousMonth = currentMonth;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // PHASE 2: Filter to only relevant dates
    return this.filterRelevantDates(timelineDates);
  }

  private filterRelevantDates(allDates: TimelineDate[]): TimelineDate[] {
    const todayKey = this.formatDateKey(new Date());
    const showBalanceIndicatorSetting = this.entryService.showBalanceIndicator();
    const filtered: TimelineDate[] = [];

    for (const current of allDates) {
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

        // Determine if balance indicator should show
        // Show if: setting enabled AND (day has entries OR is today)
        const showBalanceIndicator = showBalanceIndicatorSetting && (hasEntries || isToday);

        filtered.push({
          ...current,
          isToday,
          daysSkipped,
          showMonthHeader: false,
          showBalanceIndicator
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
        // Use substring(0,10) to extract YYYY-MM-DD directly from ISO string to avoid timezone issues
        const hasDeleteMarker = entries.some(
          e => e.isDeleted === true &&
               e.parentEntryId === occurrence.entry.id &&
               e.specificDate?.substring(0, 10) === dateKey
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

  private formatDisplayDate(date: Date): { day: string; month: string; weekday: string } {
    const day = date.getDate().toString();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return { day, month, weekday };
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

  onDateRowClick(date: Date): void {
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
        // Regenerate timeline after adding entry
        this.regenerateAllSegments();

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
        // Regenerate timeline after updating entry
        this.regenerateAllSegments();

        this.snackBar.open('Entry updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      } else if (result && result.action === 'added') {
        // Regenerate timeline after adding override entry
        this.regenerateAllSegments();

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

          // Regenerate timeline after deleting single occurrence
          this.regenerateAllSegments();

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
        // If this is an override entry (has parentEntryId), also create a deletion marker
        // for the parent recurring entry to prevent it from showing through
        if (entry.parentEntryId && entry.specificDate) {
          this.entryService.deleteSingleOccurrence(
            entry.parentEntryId,
            new Date(entry.specificDate)
          );
        }

        this.entryService.deleteEntry(entry.id);

        // Regenerate timeline after deleting entry
        this.regenerateAllSegments();

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

  isDarkColor(hexColor: string): boolean {
    return isDarkColor(hexColor);
  }

  /**
   * Get the appropriate background color for an entry based on theme
   * In dark mode, returns a darkened equivalent; in light mode, returns original
   */
  getEntryBackgroundColor(color: string | undefined): string {
    const baseColor = color || '#fafafa';

    // If in dark mode, transform to dark equivalent
    if (this.themeService.isDarkMode()) {
      return getDarkModeColor(baseColor);
    }

    return baseColor;
  }
}
