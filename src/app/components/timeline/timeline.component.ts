import { Component, OnInit, ViewChild, AfterViewInit, signal, computed, inject } from '@angular/core';
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
import { UpdateOptionsDialogComponent, UpdateOption } from '../update-options-dialog/update-options-dialog.component';

interface TimelineDate {
  date: Date;
  dateKey: string; // YYYY-MM-DD for comparison
  displayDate: string; // "10 Dec"
  isMonthStart: boolean;
  monthYear: string; // "December 2024" for headers
  entries: EntryOccurrence[];
}

interface EntryOccurrence {
  entry: Entry;
  date: Date;
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
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent implements OnInit, AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  // Signals for reactive data
  private startDate = signal<Date>(this.getDateMonthsAgo(6));
  private endDate = signal<Date>(this.getDateMonthsAhead(6));

  // Computed timeline dates
  timelineDates = computed<TimelineDate[]>(() => {
    const start = this.startDate();
    const end = this.endDate();
    const entries = this.entryService.entries();

    return this.generateTimelineDates(start, end, entries);
  });

  todayIndex = computed(() => {
    const dates = this.timelineDates();
    const todayKey = this.formatDateKey(new Date());
    return dates.findIndex(d => d.dateKey === todayKey);
  });

  // Track the current visible date range
  private currentVisibleIndex = signal<number>(0);

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

  constructor(public entryService: EntryService) {}

  ngOnInit(): void {
    // Initialization handled by signals
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

    // Load more past dates if scrolling near the top (within 30 items)
    if (scrollIndex < 30) {
      this.loadMorePast();
    }

    // Load more future dates if scrolling near the bottom (within 30 items from end)
    if (scrollIndex > totalItems - 30) {
      this.loadMoreFuture();
    }
  }

  private loadMorePast(): void {
    const currentStart = this.startDate();
    const newStart = this.getDateMonthsBeforeDate(currentStart, 3);
    this.startDate.set(newStart);
  }

  private loadMoreFuture(): void {
    const currentEnd = this.endDate();
    const newEnd = this.getDateMonthsAfterDate(currentEnd, 3);
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

    let previousMonth = -1;

    while (currentDate <= end) {
      const dateKey = this.formatDateKey(currentDate);
      const displayDate = this.formatDisplayDate(currentDate);
      const currentMonth = currentDate.getMonth();
      const isMonthStart = currentMonth !== previousMonth;
      const monthYear = this.formatMonthYear(currentDate);

      // Find all entries that occur on this date
      const entriesForDate = this.getEntriesForDate(currentDate, entries);

      timelineDates.push({
        date: new Date(currentDate),
        dateKey,
        displayDate,
        isMonthStart,
        monthYear,
        entries: entriesForDate
      });

      previousMonth = currentMonth;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return timelineDates;
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
      const entryOccurrences = generateOccurrences(entry, dayStart, dayEnd);

      for (const occurrenceDate of entryOccurrences) {
        const occurrenceKey = this.formatDateKey(occurrenceDate);
        if (occurrenceKey === dateKey) {
          occurrences.push({
            entry,
            date: occurrenceDate
          });
        }
      }
    }

    // Filter out recurring entries that have an override for this date
    const filteredOccurrences = occurrences.filter(occurrence => {
      // If this is a recurring entry (not 'once'), check if there's an override
      if (occurrence.entry.repeatType !== 'once') {
        // Look for a one-time entry with this entry's ID as parentEntryId
        const hasOverride = occurrences.some(
          other =>
            other.entry.repeatType === 'once' &&
            other.entry.parentEntryId === occurrence.entry.id &&
            this.formatDateKey(other.date) === dateKey
        );
        // If there's an override for this date, exclude the recurring entry
        return !hasOverride;
      }
      // Keep all one-time entries
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

  isToday(dateKey: string): boolean {
    return dateKey === this.formatDateKey(new Date());
  }

  trackByDateKey(index: number, item: TimelineDate): string {
    return item.dateKey;
  }

  onEntryClick(entry: Entry, occurrenceDate: Date): void {
    const bottomSheetRef = this.bottomSheet.open(EntryActionsSheetComponent, {
      data: entry
    });

    bottomSheetRef.afterDismissed().subscribe((action: EntryAction | undefined) => {
      if (action === 'edit') {
        this.openEditDialog(entry, occurrenceDate);
      } else if (action === 'delete') {
        this.openDeleteConfirmation(entry);
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

  private openDeleteConfirmation(entry: Entry): void {
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
