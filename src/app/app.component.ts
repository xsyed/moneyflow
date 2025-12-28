import { Component, inject, OnInit, signal, computed, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TimelineComponent } from './components/timeline/timeline.component';
import { EntryDialogComponent } from './components/entry-dialog/entry-dialog.component';
import { BalanceDisplayComponent } from './components/balance-display/balance-display.component';
import { InitialBalanceDialogComponent } from './components/initial-balance-dialog/initial-balance-dialog.component';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { EntryService } from './services/entry.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    TimelineComponent,
    BalanceDisplayComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'Money Stream';
  private dialog = inject(MatDialog);
  private entryService = inject(EntryService);
  private themeService = inject(ThemeService); // Initialize theme detection

  // Mobile detection signals
  isMobile = signal<boolean>(false);
  isBottomBarVisible = signal<boolean>(true);
  showMobileLayout = computed(() => this.isMobile());

  // Handle window resize for mobile breakpoint detection
  @HostListener('window:resize')
  onResize(): void {
    this.checkMobileBreakpoint();
  }

  private checkMobileBreakpoint(): void {
    const wasMobile = this.isMobile();
    this.isMobile.set(window.innerWidth <= 768);
    // Reset bottom bar visibility when switching to mobile
    if (!wasMobile && this.isMobile()) {
      this.isBottomBarVisible.set(true);
    }
  }

  // Handle scroll direction from timeline component
  onScrollDirection(direction: 'up' | 'down'): void {
    if (!this.isMobile()) return;
    // Hide when scrolling down (toward future), show when scrolling up (toward past)
    this.isBottomBarVisible.set(direction === 'up');
  }

  ngOnInit(): void {
    // Check initial viewport size
    this.checkMobileBreakpoint();
    // Check if initial balance has been set
    if (!this.entryService.hasInitialBalance()) {
      this.openInitialBalanceDialog();
    }
  }

  private openInitialBalanceDialog(): void {
    const dialogRef = this.dialog.open(InitialBalanceDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      disableClose: true  // User MUST set initial balance
    });

    // Ensure timeline re-initializes after balance is set
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Balance was set - timeline will auto-update via computed signals
      }
    });
  }

  openAddEntryDialog(): void {
    this.dialog.open(EntryDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false
    });
  }

  openSettingsDialog(): void {
    this.dialog.open(SettingsDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false
    });
  }
}
