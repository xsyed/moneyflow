import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TimelineComponent } from './components/timeline/timeline.component';
import { EntryDialogComponent } from './components/entry-dialog/entry-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    TimelineComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Income Flow';
  private dialog = inject(MatDialog);

  openAddEntryDialog(): void {
    this.dialog.open(EntryDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false
    });
  }
}
