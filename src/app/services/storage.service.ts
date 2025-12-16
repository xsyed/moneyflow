import { Injectable } from '@angular/core';
import { Entry, AppSettings } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ENTRIES_KEY = 'moneystream_entries';
  private readonly SETTINGS_KEY = 'moneystream_settings';

  saveEntries(entries: Entry[]): void {
    try {
      localStorage.setItem(this.ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving entries to localStorage:', error);
    }
  }

  loadEntries(): Entry[] {
    try {
      const stored = localStorage.getItem(this.ENTRIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading entries from localStorage:', error);
      return [];
    }
  }

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }

  loadSettings(): AppSettings | null {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      return null;
    }
  }
}
