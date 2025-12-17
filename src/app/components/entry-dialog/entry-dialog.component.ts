import { Component, inject, signal, effect, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EntryService } from '../../services/entry.service';
import { RepeatType, EntryType, Entry } from '../../models/entry.model';
import { UpdateOption } from '../update-options-dialog/update-options-dialog.component';

export interface EntryDialogData {
  entry?: Entry;
  occurrenceDate?: Date;
  updateOption?: UpdateOption | null;
  initialDate?: Date;
}

@Component({
  selector: 'app-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './entry-dialog.component.html',
  styleUrl: './entry-dialog.component.scss'
})
export class EntryDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EntryDialogComponent>);
  private entryService = inject(EntryService);

  entryForm: FormGroup;
  repeatType = signal<RepeatType>('monthly');
  isEditMode = signal<boolean>(false);
  entry: Entry | null = null;
  occurrenceDate: Date | null = null;
  updateOption: UpdateOption | null = null;

  // Days 1-31 for monthly selection
  days = Array.from({ length: 31 }, (_, i) => i + 1);

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: EntryDialogData | Entry | null) {
    let initialDate: Date | null = null;

    // Handle both old and new data formats for backward compatibility
    if (data && 'entry' in data) {
      // New format: { entry, occurrenceDate, updateOption, initialDate }
      this.entry = data.entry || null;
      this.occurrenceDate = data.occurrenceDate || null;
      this.updateOption = data.updateOption || null;
      initialDate = data.initialDate || null;
    } else {
      // Old format: just the entry (for adding new entries)
      this.entry = data as Entry;
    }

    // Determine if this is edit mode
    this.isEditMode.set(!!this.entry);

    // Initialize form with default or existing values
    const defaultDayOfMonth = initialDate ? initialDate.getDate() : 1;
    const defaultStartDate = initialDate ? new Date(initialDate) : null;

    this.entryForm = this.fb.group({
      label: [this.entry?.label || '', [Validators.required, Validators.minLength(1)]],
      note: [this.entry?.note || '', [Validators.maxLength(100)]],
      amount: [this.entry?.amount || '', [Validators.required, Validators.min(0.01)]],
      type: [this.entry?.type || 'expense' as EntryType, Validators.required],
      repeatType: [this.entry?.repeatType || 'monthly' as RepeatType, Validators.required],
      dayOfMonth: [this.entry?.dayOfMonth || defaultDayOfMonth, [Validators.required, Validators.min(1), Validators.max(31)]],
      startDate: [this.entry?.startDate ? new Date(this.entry.startDate) : defaultStartDate],
      specificDate: [this.entry?.specificDate ? new Date(this.entry.specificDate) : defaultStartDate]
    });

    // Set initial repeat type from data
    if (this.entry?.repeatType) {
      this.repeatType.set(this.entry.repeatType);
    }

    // Set up effect to handle conditional validation
    effect(() => {
      const repeat = this.repeatType();
      this.updateConditionalValidation(repeat);
    });

    // Listen to repeatType changes
    this.entryForm.get('repeatType')?.valueChanges.subscribe(value => {
      this.repeatType.set(value);
    });
  }

  private updateConditionalValidation(repeatType: RepeatType): void {
    const dayOfMonthControl = this.entryForm.get('dayOfMonth');
    const startDateControl = this.entryForm.get('startDate');
    const specificDateControl = this.entryForm.get('specificDate');

    if (repeatType === 'monthly') {
      // Monthly: require dayOfMonth, clear startDate and specificDate
      dayOfMonthControl?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
      startDateControl?.clearValidators();
      startDateControl?.setValue(null);
      specificDateControl?.clearValidators();
      specificDateControl?.setValue(null);
    } else if (repeatType === 'weekly' || repeatType === 'biweekly') {
      // Weekly/Biweekly: require startDate, clear dayOfMonth and specificDate
      startDateControl?.setValidators([Validators.required]);
      dayOfMonthControl?.clearValidators();
      dayOfMonthControl?.setValue(null);
      specificDateControl?.clearValidators();
      specificDateControl?.setValue(null);
    } else if (repeatType === 'once') {
      // Once: require specificDate, clear dayOfMonth and startDate
      specificDateControl?.setValidators([Validators.required]);
      dayOfMonthControl?.clearValidators();
      dayOfMonthControl?.setValue(null);
      startDateControl?.clearValidators();
      startDateControl?.setValue(null);
    }

    dayOfMonthControl?.updateValueAndValidity();
    startDateControl?.updateValueAndValidity();
    specificDateControl?.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.entryForm.valid) {
      const formValue = this.entryForm.value;

      // Build base entry data
      const entryData: any = {
        label: formValue.label.trim(),
        note: formValue.note?.trim() || undefined,
        amount: parseFloat(formValue.amount),
        type: formValue.type,
        repeatType: formValue.repeatType
      };

      // Add conditional fields based on repeat type
      if (formValue.repeatType === 'monthly') {
        entryData.dayOfMonth = formValue.dayOfMonth;
      } else if (formValue.repeatType === 'weekly' || formValue.repeatType === 'biweekly') {
        // Convert Date to UTC ISO string for storage
        entryData.startDate = this.toUTC(formValue.startDate).toISOString();
      } else if (formValue.repeatType === 'once') {
        // For one-time entries, store the specific date
        entryData.specificDate = this.toUTC(formValue.specificDate).toISOString();
      }

      // Handle different scenarios
      if (!this.isEditMode()) {
        // Scenario 1: Adding a new entry
        this.entryService.addEntry(entryData);
        this.dialogRef.close({ action: 'added', data: entryData });
      } else if (this.updateOption === 'this-only') {
        // Scenario 2: Update this occurrence only - create a one-time entry for this specific date
        const oneTimeEntry: any = {
          ...entryData,
          repeatType: 'once',
          specificDate: this.toUTC(this.occurrenceDate!).toISOString(),
          parentEntryId: this.entry!.id
        };
        // Clear fields not needed for one-time entries
        delete oneTimeEntry.dayOfMonth;
        delete oneTimeEntry.startDate;

        this.entryService.addEntry(oneTimeEntry);
        this.dialogRef.close({ action: 'added', data: oneTimeEntry });
      } else if (this.updateOption === 'all-future') {
        // Scenario 3: Update all future occurrences - update the recurring entry
        this.entryService.updateEntry(this.entry!.id, entryData);
        this.dialogRef.close({ action: 'updated', data: entryData });
      } else {
        // Scenario 4: Editing a one-time entry
        this.entryService.updateEntry(this.entry!.id, entryData);
        this.dialogRef.close({ action: 'updated', data: entryData });
      }
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
    return this.entryForm.valid;
  }
}
