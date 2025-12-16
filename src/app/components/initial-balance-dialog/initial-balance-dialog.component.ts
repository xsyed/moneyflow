import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { EntryService } from '../../services/entry.service';

@Component({
  selector: 'app-initial-balance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './initial-balance-dialog.component.html',
  styleUrl: './initial-balance-dialog.component.scss'
})
export class InitialBalanceDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InitialBalanceDialogComponent>);
  private entryService = inject(EntryService);

  balanceForm: FormGroup;

  constructor() {
    this.balanceForm = this.fb.group({
      initialBalance: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  onSubmit(): void {
    if (this.balanceForm.valid) {
      const amount = parseFloat(this.balanceForm.value.initialBalance);
      this.entryService.setInitialBalance(amount);
      this.dialogRef.close(true);
    }
  }

  get isFormValid(): boolean {
    return this.balanceForm.valid;
  }
}
