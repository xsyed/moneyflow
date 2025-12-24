import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { StorageService } from './storage.service';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageService = inject(StorageService);

  // Private signals for internal state
  private systemPreference = signal<'light' | 'dark'>('light');
  private userPreference = signal<ThemeMode>('system');

  // Public computed signal for whether dark mode is active
  public isDarkMode = computed(() => {
    if (this.userPreference() === 'system') {
      return this.systemPreference() === 'dark';
    }
    return this.userPreference() === 'dark';
  });

  // Public computed signal for current theme mode
  public currentThemeMode = computed(() => this.userPreference());

  constructor() {
    // Initialize from localStorage
    this.loadThemePreference();

    // Setup media query listener for system preference
    this.setupMediaQueryListener();

    // Effect to apply theme when isDarkMode changes
    effect(() => {
      this.applyTheme();
    });
  }

  /**
   * Set the user's theme preference and persist it
   */
  setThemeMode(mode: ThemeMode): void {
    this.userPreference.set(mode);
    this.saveThemePreference(mode);
  }

  /**
   * Apply the theme by toggling the dark-theme class on document element
   */
  private applyTheme(): void {
    const isDark = this.isDarkMode();
    document.documentElement.classList.toggle('dark-theme', isDark);
  }

  /**
   * Setup media query listener to detect system preference changes
   */
  private setupMediaQueryListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Set initial system preference
    this.systemPreference.set(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes to system preference
    mediaQuery.addEventListener('change', (e) => {
      this.systemPreference.set(e.matches ? 'dark' : 'light');
    });
  }

  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference(): void {
    const settings = this.storageService.loadSettings();
    if (settings?.themeMode) {
      this.userPreference.set(settings.themeMode);
    } else {
      // Default to 'system' if no preference is saved
      this.userPreference.set('system');
    }
  }

  /**
   * Save theme preference to localStorage via settings
   */
  private saveThemePreference(mode: ThemeMode): void {
    const settings = this.storageService.loadSettings();
    if (settings) {
      settings.themeMode = mode;
      this.storageService.saveSettings(settings);
    }
  }
}
