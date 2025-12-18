import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EntryService } from '../../services/entry.service';
import { AppSettings } from '../../models/entry.model';

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
    MatCheckboxModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss'
})
export class SettingsDialogComponent {
  private fb = inject(FormBuilder);
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
}
