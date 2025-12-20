import { Injectable } from '@angular/core';
import { Entry, AppSettings } from '../models/entry.model';

export interface ExportData {
  entries: Entry[];
  settings: AppSettings;
}

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
      const settings: AppSettings | null = stored ? JSON.parse(stored) : null;

      return settings;
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      return null;
    }
  }

  exportData(): ExportData {
    const entries = this.loadEntries();
    const settings = this.loadSettings();

    if (!settings) {
      throw new Error('Cannot export: Settings not found');
    }

    return {
      entries,
      settings
    };
  }

  importData(data: ExportData): void {
    // Validate data structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid file format. Please select a valid MoneyStream export file.');
    }

    if (!data.entries || !data.settings) {
      throw new Error('Import file must contain both entries and settings data.');
    }

    if (!Array.isArray(data.entries)) {
      throw new Error('Import file contains invalid entry data.');
    }

    if (typeof data.settings !== 'object') {
      throw new Error('Import file contains invalid settings data.');
    }

    // Validate each entry has required fields
    for (const entry of data.entries) {
      if (!entry.id || typeof entry.id !== 'string') {
        throw new Error('Import file contains invalid entry data.');
      }
      if (!entry.label || typeof entry.label !== 'string') {
        throw new Error('Import file contains invalid entry data.');
      }
      if (typeof entry.amount !== 'number') {
        throw new Error('Import file contains invalid entry data.');
      }
      if (!entry.type || (entry.type !== 'income' && entry.type !== 'expense')) {
        throw new Error('Import file contains invalid entry data.');
      }
      if (!entry.repeatType || !['monthly', 'weekly', 'biweekly', 'once'].includes(entry.repeatType)) {
        throw new Error('Import file contains invalid entry data.');
      }
      if (!entry.createdAt || typeof entry.createdAt !== 'string') {
        throw new Error('Import file contains invalid entry data.');
      }
    }

    // Validate settings has required fields
    if (typeof data.settings.initialBalance !== 'number') {
      throw new Error('Import file contains invalid settings data.');
    }
    if (!data.settings.balanceSetDate || typeof data.settings.balanceSetDate !== 'string') {
      throw new Error('Import file contains invalid settings data.');
    }

    // Validation passed - save the data
    try {
      this.saveEntries(data.entries);
      this.saveSettings(data.settings);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data. Please try again.');
    }
  }
}
