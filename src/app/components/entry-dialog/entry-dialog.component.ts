import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EntryService } from '../../services/entry.service';
import { RepeatType, EntryType } from '../../models/entry.model';

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

  // Days 1-31 for monthly selection
  days = Array.from({ length: 31 }, (_, i) => i + 1);

  constructor() {
    // Initialize form with default values
    this.entryForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(1)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['expense' as EntryType, Validators.required],
      repeatType: ['monthly' as RepeatType, Validators.required],
      dayOfMonth: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      startDate: [null]
    });

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

    if (repeatType === 'monthly') {
      // Monthly: require dayOfMonth, clear startDate
      dayOfMonthControl?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
      startDateControl?.clearValidators();
      startDateControl?.setValue(null);
    } else {
      // Weekly/Biweekly: require startDate, clear dayOfMonth
      startDateControl?.setValidators([Validators.required]);
      dayOfMonthControl?.clearValidators();
      dayOfMonthControl?.setValue(null);
    }

    dayOfMonthControl?.updateValueAndValidity();
    startDateControl?.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.entryForm.valid) {
      const formValue = this.entryForm.value;

      // Build entry object based on repeat type
      const entry: any = {
        label: formValue.label.trim(),
        amount: parseFloat(formValue.amount),
        type: formValue.type,
        repeatType: formValue.repeatType
      };

      // Add conditional fields
      if (formValue.repeatType === 'monthly') {
        entry.dayOfMonth = formValue.dayOfMonth;
      } else {
        // Convert Date to ISO string for storage
        entry.startDate = formValue.startDate.toISOString();
      }

      // Add entry via service
      this.entryService.addEntry(entry);

      // Close dialog
      this.dialogRef.close(entry);
    }
  }

  get isFormValid(): boolean {
    return this.entryForm.valid;
  }
}
