import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type UpdateOption = 'this-only' | 'all-future';

@Component({
  selector: 'app-update-options-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './update-options-dialog.component.html',
  styleUrl: './update-options-dialog.component.scss'
})
export class UpdateOptionsDialogComponent {
  private dialogRef = inject(MatDialogRef<UpdateOptionsDialogComponent>);

  onThisOnly(): void {
    this.dialogRef.close('this-only' as UpdateOption);
  }

  onAllFuture(): void {
    this.dialogRef.close('all-future' as UpdateOption);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
