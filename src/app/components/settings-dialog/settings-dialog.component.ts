import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { EntryService } from '../../services/entry.service';
import { AppSettings } from '../../models/entry.model';
import { ExportData } from '../../services/storage.service';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss'
})
export class SettingsDialogComponent {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<SettingsDialogComponent>);
  private entryService = inject(EntryService);

  settingsForm: FormGroup;
  hasChanges = signal<boolean>(false);

  constructor() {
    const currentSettings = this.entryService.settings();

    this.settingsForm = this.fb.group({
      initialBalance: [
        currentSettings?.initialBalance || '',
        [Validators.required, Validators.min(0.01)]
      ],
      balanceSetDate: [
        currentSettings?.balanceSetDate ? new Date(currentSettings.balanceSetDate) : new Date(),
        Validators.required
      ],
      showDaysIndicator: [currentSettings?.showDaysIndicator ?? false],
      showBalanceIndicator: [currentSettings?.showBalanceIndicator ?? false]
    });

    // Track changes to enable/disable save button
    this.settingsForm.valueChanges.subscribe(() => {
      this.hasChanges.set(this.settingsForm.dirty);
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.settingsForm.valid) {
      const formValue = this.settingsForm.value;

      // Create updated settings
      const newSettings: AppSettings = {
        initialBalance: parseFloat(formValue.initialBalance),
        balanceSetDate: this.toUTC(formValue.balanceSetDate).toISOString(),
        showDaysIndicator: formValue.showDaysIndicator,
        showBalanceIndicator: formValue.showBalanceIndicator
      };

      // Update via service method
      this.entryService.updateSettings(newSettings);
      this.dialogRef.close(true);
    }
  }

  // Convert local date to UTC date
  private toUTC(date: Date): Date {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
  }

  get isFormValid(): boolean {
    return this.settingsForm.valid && this.hasChanges();
  }

  onExport(): void {
    try {
      const data = this.entryService.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `moneystream-export-${this.formatDate(new Date())}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export data. Please try again.';
      this.showErrorDialog(message);
    }
  }

  onImport(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      const confirmed = confirm(
        'Import Data?\n\nThis will delete all your existing data. This action cannot be undone.\n\nDo you want to continue?'
      );

      if (!confirmed) return;

      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content) as ExportData;

          this.entryService.importData(data);

          this.dialogRef.close(true);
          alert('Data imported successfully!');
        } catch (error) {
          let message = 'Failed to import data. Please try again.';

          if (error instanceof SyntaxError) {
            message = 'Invalid JSON file. Please select a valid export file.';
          } else if (error instanceof Error) {
            message = error.message;
          }

          this.showErrorDialog(message);
        }
      };

      reader.onerror = () => {
        this.showErrorDialog('Could not read the selected file. Please try again.');
      };

      reader.readAsText(file);
    };

    input.click();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private showErrorDialog(message: string): void {
    alert(message);
  }
}
