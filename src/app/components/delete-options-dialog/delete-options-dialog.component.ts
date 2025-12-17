import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type DeleteOption = 'this-only' | 'all-occurrences';

@Component({
  selector: 'app-delete-options-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './delete-options-dialog.component.html',
  styleUrl: './delete-options-dialog.component.scss'
})
export class DeleteOptionsDialogComponent {
  private dialogRef = inject(MatDialogRef<DeleteOptionsDialogComponent>);

  onThisOnly(): void {
    this.dialogRef.close('this-only');
  }

  onAllOccurrences(): void {
    this.dialogRef.close('all-occurrences');
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
