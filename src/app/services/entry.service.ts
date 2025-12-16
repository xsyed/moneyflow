import { Injectable, signal, computed } from '@angular/core';
import { Entry, AppSettings } from '../models/entry.model';
import { StorageService } from './storage.service';

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

  setInitialBalance(amount: number): void {
    const newSettings: AppSettings = {
      initialBalance: amount,
      balanceSetDate: new Date().toISOString()
    };

    this.settings.set(newSettings);
    this.storageService.saveSettings(newSettings);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
