import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EntryService } from '../../services/entry.service';

@Component({
  selector: 'app-balance-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './balance-display.component.html',
  styleUrl: './balance-display.component.scss'
})
export class BalanceDisplayComponent {
  private entryService = inject(EntryService);

  currentBalance = this.entryService.currentBalance;
  hasInitialBalance = this.entryService.hasInitialBalance;

  formattedBalance = computed(() =>
    this.entryService.formatCurrency(this.currentBalance())
  );

  isPositive = computed(() => this.currentBalance() >= 0);
  isNegative = computed(() => this.currentBalance() < 0);
}
