import { Component, OnInit, ViewChild, AfterViewInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EntryService } from '../../services/entry.service';
import { Entry } from '../../models/entry.model';
import { generateOccurrences } from '../../utils/date.utils';

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
    MatIconModule
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

  constructor(public entryService: EntryService) {}

  ngOnInit(): void {
    // Initialization handled by signals
  }

  ngAfterViewInit(): void {
    // Scroll to today after view is initialized
    setTimeout(() => {
      this.scrollToToday();
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

    // Sort by amount (income first, then expenses)
    return occurrences.sort((a, b) => {
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
}
