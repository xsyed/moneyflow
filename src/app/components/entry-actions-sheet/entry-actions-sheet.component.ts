import { Component, inject, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Entry } from '../../models/entry.model';

export type EntryAction = 'edit' | 'delete';

@Component({
  selector: 'app-entry-actions-sheet',
  standalone: true,
  imports: [MatBottomSheetModule, MatListModule, MatIconModule],
  templateUrl: './entry-actions-sheet.component.html',
  styleUrl: './entry-actions-sheet.component.scss'
})
export class EntryActionsSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<EntryActionsSheetComponent>);

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public entry: Entry) {}

  onEdit(): void {
    this.bottomSheetRef.dismiss('edit' as EntryAction);
  }

  onDelete(): void {
    this.bottomSheetRef.dismiss('delete' as EntryAction);
  }

  getRepeatText(): string {
    const repeat = this.entry.repeatType.charAt(0).toUpperCase() + this.entry.repeatType.slice(1);

    if (this.entry.repeatType === 'monthly' && this.entry.dayOfMonth) {
      return `${repeat} (Day ${this.entry.dayOfMonth})`;
    } else if ((this.entry.repeatType === 'weekly' || this.entry.repeatType === 'biweekly') && this.entry.startDate) {
      const date = new Date(this.entry.startDate);
      const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${repeat} (from ${formatted})`;
    }

    return repeat;
  }
}
