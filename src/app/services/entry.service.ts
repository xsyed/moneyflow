import { Injectable, signal, computed } from '@angular/core';
import { Entry, AppSettings } from '../models/entry.model';
import { StorageService } from './storage.service';
import { generateOccurrences } from '../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  entries = signal<Entry[]>([]);
  settings = signal<AppSettings | null>(null);

  totalEntries = computed(() => this.entries().length);
  hasInitialBalance = computed(() => this.settings() !== null);

  constructor(private storageService: StorageService) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const entries = this.storageService.loadEntries();
    const settings = this.storageService.loadSettings();

    this.entries.set(entries);
    this.settings.set(settings);
  }

  addEntry(entry: Omit<Entry, 'id' | 'createdAt'>): void {
    const newEntry: Entry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    const updatedEntries = [...this.entries(), newEntry];
    this.entries.set(updatedEntries);
    this.storageService.saveEntries(updatedEntries);
  }

  updateEntry(id: string, updates: Partial<Entry>): void {
    const updatedEntries = this.entries().map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    );

    this.entries.set(updatedEntries);
    this.storageService.saveEntries(updatedEntries);
  }

  deleteEntry(id: string): void {
    const updatedEntries = this.entries().filter(entry => entry.id !== id);

    this.entries.set(updatedEntries);
    this.storageService.saveEntries(updatedEntries);
  }

  deleteSingleOccurrence(entryId: string, occurrenceDate: Date): void {
    const entry = this.entries().find(e => e.id === entryId);
    if (!entry) return;

    // Create deletion marker
    const deletionMarker: Entry = {
      id: this.generateId(),
      label: entry.label,
      amount: 0,
      type: entry.type,
      repeatType: 'once',
      specificDate: occurrenceDate.toISOString(),
      createdAt: new Date().toISOString(),
      parentEntryId: entryId,
      isDeleted: true
    };

    this.addEntry(deletionMarker);
  }

  setInitialBalance(amount: number): void {
    const newSettings: AppSettings = {
      initialBalance: amount,
      balanceSetDate: new Date().toISOString()
    };

    this.settings.set(newSettings);
    this.storageService.saveSettings(newSettings);
  }

  updateSettings(settings: AppSettings): void {
    this.settings.set(settings);
    this.storageService.saveSettings(settings);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private generateAllOccurrences(
    entries: Entry[],
    startDate: Date,
    endDate: Date,
    settings?: AppSettings
  ): Array<{ entry: Entry; date: Date }> {
    const occurrences: Array<{ entry: Entry; date: Date }> = [];

    // Generate all occurrences for each entry
    for (const entry of entries) {
      const entryOccurrences = generateOccurrences(
        entry,
        startDate,
        endDate
      );
      for (const date of entryOccurrences) {
        occurrences.push({ entry, date });
      }
    }

    // Filter out recurring entries that have one-time overrides (parentEntryId logic)
    return occurrences.filter(occurrence => {
      if (occurrence.entry.repeatType !== 'once') {
        const dateKey = this.formatDateKey(occurrence.date);
        const hasOverride = occurrences.some(
          other =>
            other.entry.repeatType === 'once' &&
            other.entry.parentEntryId === occurrence.entry.id &&
            this.formatDateKey(other.date) === dateKey
        );
        return !hasOverride;
      }
      return true;
    });
  }

  private calculateBalanceMap(settings: AppSettings, entries: Entry[]): Map<string, number> {
    const balanceMap = new Map<string, number>();

    // Parse balance set date
    const balanceSetDate = new Date(settings.balanceSetDate);
    balanceSetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Define calculation range: from min(balanceSetDate, today) to today + 18 months
    const startDate = new Date(Math.min(balanceSetDate.getTime(), today.getTime()));
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 18); // 18 months forward

    // Generate all occurrences with cutoff settings
    const allOccurrences = this.generateAllOccurrences(entries, startDate, endDate, settings);

    // Sort by date
    allOccurrences.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate running balance day by day
    let currentBalance = settings.initialBalance;
    let currentDate = new Date(balanceSetDate);
    currentDate.setHours(0, 0, 0, 0);

    // Initialize balance at balanceSetDate
    balanceMap.set(this.formatDateKey(balanceSetDate), currentBalance);

    // Process each date from balanceSetDate to endDate
    while (currentDate <= endDate) {
      const dateKey = this.formatDateKey(currentDate);

      // Apply all transactions for this date
      const transactionsForDay = allOccurrences.filter(occ =>
        this.formatDateKey(occ.date) === dateKey
      );

      for (const transaction of transactionsForDay) {
        if (transaction.entry.type === 'income') {
          currentBalance += transaction.entry.amount;
        } else {
          currentBalance -= transaction.entry.amount;
        }
      }

      balanceMap.set(dateKey, currentBalance);

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return balanceMap;
  }

  balanceMap = computed(() => {
    const settings = this.settings();
    const entries = this.entries();

    if (!settings) return new Map<string, number>();

    return this.calculateBalanceMap(settings, entries);
  });

  getBalanceForDate(date: Date): number {
    const settings = this.settings();
    if (!settings) return 0;

    const dateKey = this.formatDateKey(date);
    const balance = this.balanceMap().get(dateKey);

    // If date not in map (before balanceSetDate or beyond range), return initialBalance
    if (balance === undefined) {
      return settings.initialBalance;
    }

    return balance;
  }

  currentBalance = computed(() => {
    const today = new Date();
    return this.getBalanceForDate(today);
  });

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
