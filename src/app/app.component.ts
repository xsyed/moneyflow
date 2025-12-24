import { Component, inject, OnInit } from '@angular/core';
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
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    TimelineComponent,
    BalanceDisplayComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Money Stream';
  private dialog = inject(MatDialog);
  private entryService = inject(EntryService);
  private themeService = inject(ThemeService); // Initialize theme detection

  ngOnInit(): void {
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
