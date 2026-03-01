import { Injectable, OnDestroy, computed, signal } from '@angular/core';

interface InstallChoiceResult {
  outcome: 'accepted' | 'dismissed';
  platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<InstallChoiceResult>;
  prompt(): Promise<void>;
}

type PromptInstallResult = 'accepted' | 'dismissed' | 'unavailable';

@Injectable({
  providedIn: 'root'
})
export class InstallPromptService implements OnDestroy {
  private readonly dismissStorageKey = 'moneystream_install_dismissed_until';
  private readonly defaultDismissDays = 7;

  private readonly deferredPromptEvent = signal<BeforeInstallPromptEvent | null>(null);
  private readonly installedState = signal<boolean>(this.detectInstalledMode());
  private readonly iosInstallableState = signal<boolean>(this.detectIosInstallable());
  private readonly dismissedUntilState = signal<number | null>(this.readDismissedUntil());

  readonly isInstalled = computed(() => this.installedState());
  readonly canPromptNative = computed(() => !this.installedState() && this.deferredPromptEvent() !== null);
  readonly isIosInstallable = computed(() => {
    return !this.installedState() && !this.canPromptNative() && this.iosInstallableState();
  });
  readonly dismissedUntil = computed(() => this.dismissedUntilState());
  readonly shouldShowInstallUi = computed(() => {
    if (this.installedState()) {
      return false;
    }

    const dismissedUntil = this.dismissedUntilState();
    if (dismissedUntil && Date.now() < dismissedUntil) {
      return false;
    }

    return this.canPromptNative() || this.isIosInstallable();
  });

  private readonly beforeInstallPromptHandler = (event: Event): void => {
    const installEvent = event as BeforeInstallPromptEvent;
    installEvent.preventDefault();
    this.deferredPromptEvent.set(installEvent);
    this.iosInstallableState.set(this.detectIosInstallable());
  };

  private readonly appInstalledHandler = (): void => {
    this.installedState.set(true);
    this.deferredPromptEvent.set(null);
    this.clearDismissal();
  };

  private readonly displayModeChangeHandler = (): void => {
    this.installedState.set(this.detectInstalledMode());
    this.iosInstallableState.set(this.detectIosInstallable());
  };

  private mediaQueryList: MediaQueryList | null = null;

  constructor() {
    if (!this.isBrowser()) {
      return;
    }

    this.clearDismissalIfExpired();
    this.installedState.set(this.detectInstalledMode());
    this.iosInstallableState.set(this.detectIosInstallable());

    window.addEventListener('beforeinstallprompt', this.beforeInstallPromptHandler);
    window.addEventListener('appinstalled', this.appInstalledHandler);
    window.addEventListener('focus', this.displayModeChangeHandler);

    this.mediaQueryList = window.matchMedia('(display-mode: standalone)');
    if (this.mediaQueryList.addEventListener) {
      this.mediaQueryList.addEventListener('change', this.displayModeChangeHandler);
    } else {
      this.mediaQueryList.addListener(this.displayModeChangeHandler);
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser()) {
      return;
    }

    window.removeEventListener('beforeinstallprompt', this.beforeInstallPromptHandler);
    window.removeEventListener('appinstalled', this.appInstalledHandler);
    window.removeEventListener('focus', this.displayModeChangeHandler);

    if (!this.mediaQueryList) {
      return;
    }

    if (this.mediaQueryList.removeEventListener) {
      this.mediaQueryList.removeEventListener('change', this.displayModeChangeHandler);
    } else {
      this.mediaQueryList.removeListener(this.displayModeChangeHandler);
    }
  }

  async promptInstall(): Promise<PromptInstallResult> {
    const promptEvent = this.deferredPromptEvent();
    if (!promptEvent) {
      return 'unavailable';
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      this.deferredPromptEvent.set(null);

      if (choice.outcome === 'accepted') {
        this.clearDismissal();
        return 'accepted';
      }

      return 'dismissed';
    } catch {
      return 'unavailable';
    }
  }

  dismissInstallUi(days = this.defaultDismissDays): void {
    const dismissedUntil = Date.now() + days * 24 * 60 * 60 * 1000;
    this.dismissedUntilState.set(dismissedUntil);

    try {
      localStorage.setItem(this.dismissStorageKey, String(dismissedUntil));
    } catch (error) {
      console.error('Error saving install dismissal state:', error);
    }
  }

  clearDismissal(): void {
    this.dismissedUntilState.set(null);

    try {
      localStorage.removeItem(this.dismissStorageKey);
    } catch (error) {
      console.error('Error clearing install dismissal state:', error);
    }
  }

  private clearDismissalIfExpired(): void {
    const dismissedUntil = this.dismissedUntilState();
    if (!dismissedUntil) {
      return;
    }

    if (Date.now() >= dismissedUntil) {
      this.clearDismissal();
    }
  }

  private readDismissedUntil(): number | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const storedValue = localStorage.getItem(this.dismissStorageKey);
      if (!storedValue) {
        return null;
      }

      const parsedValue = Number(storedValue);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    } catch (error) {
      console.error('Error reading install dismissal state:', error);
      return null;
    }
  }

  private detectInstalledMode(): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    const standaloneDisplayMode = window.matchMedia('(display-mode: standalone)').matches;
    const navigatorStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;

    return standaloneDisplayMode || navigatorStandalone;
  }

  private detectIosInstallable(): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const navigatorStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIosDevice = /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/i.test(userAgent);

    return isIosDevice && isSafari && !navigatorStandalone;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }
}
