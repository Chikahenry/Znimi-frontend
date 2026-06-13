import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService } from '../../core/services/api.services';
import { LoanCalculatorResult } from '../../core/models/models';
import { NairaPipe } from '../../shared/pipes/naira.pipe';

@Component({
  selector: 'app-loan-calculator',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, NairaPipe],
  template: `
    <div class="page-header flex-between">
      <div>
        <h2>🧮 Loan Calculator</h2>
        <div class="breadcrumb">Calculate repayment schedules and interest projections</div>
      </div>
      <a routerLink="/loans/new" class="btn btn-gold">Apply for Loan →</a>
    </div>

    <div class="grid-2">
      <!-- Input Form -->
      <div class="card">
        <div class="card-header"><h4>Loan Parameters</h4></div>
        <div class="card-body">
          <form [formGroup]="form" (ngSubmit)="calculate()">
            <div class="form-group">
              <label class="form-label">Loan Amount (₦) *</label>
              <input type="number" class="form-control" formControlName="loanAmount" placeholder="e.g. 200000">
            </div>
            <div class="form-group">
              <label class="form-label">Period (months) *</label>
              <input type="number" class="form-control" formControlName="periodInMonths" placeholder="e.g. 6" min="1" max="60">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Phase 1 Rate (%/month)</label>
                <input type="number" class="form-control" formControlName="phase1InterestRate" step="0.1">
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">First 3 months</div>
              </div>
              <div class="form-group">
                <label class="form-label">Phase 2 Rate (%/month)</label>
                <input type="number" class="form-control" formControlName="phase2InterestRate" step="0.1">
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Subsequent months</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Phase 1 Duration (months)</label>
              <input type="number" class="form-control" formControlName="phase1Months" min="1">
            </div>

            <button type="submit" class="btn btn-gold btn-lg" style="width:100%" [disabled]="loading() || form.invalid">
              @if (loading()) { <span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> }
              Calculate Repayment
            </button>
          </form>
        </div>
      </div>

      <!-- Results -->
      <div style="display:flex;flex-direction:column;gap:16px">
        @if (result()) {
          <!-- Summary Cards -->
          <div class="stat-grid" style="grid-template-columns:1fr 1fr">
            <div class="stat-card">
              <div class="stat-label">Total Repayment</div>
              <div class="stat-value money">{{ result()!.totalRepayment | naira }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Interest</div>
              <div class="stat-value money text-warning">{{ result()!.totalInterest | naira }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg Monthly</div>
              <div class="stat-value money">{{ result()!.monthlyAveragePayment | naira }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Effective Rate</div>
              <div class="stat-value">{{ result()!.summary?.effectiveInterestRate?.toFixed(2) }}%</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header flex-between">
              <h4>Repayment Schedule</h4>
              <button class="btn btn-outline btn-sm" (click)="printSchedule()">🖨 Print</button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Total</th>
                    <th>Phase</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of result()!.schedule; track s.scheduleId; let i = $index) {
                    <tr>
                      <td>{{ i + 1 }}</td>
                      <td class="money">{{ s.principalDue | naira }}</td>
                      <td class="money text-warning">{{ s.interestDue | naira }}</td>
                      <td class="money" style="font-weight:600">{{ s.totalDue | naira }}</td>
                      <td style="font-size:11px;color:var(--text-muted)">
                        {{ i < (form.value.phase1Months || 3) ? 'Phase 1' : 'Phase 2' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr style="background:var(--surface-2);font-weight:700">
                    <td>Total</td>
                    <td class="money">{{ form.value.loanAmount | naira }}</td>
                    <td class="money text-warning">{{ result()!.totalInterest | naira }}</td>
                    <td class="money">{{ result()!.totalRepayment | naira }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        } @else {
          <div class="card">
            <div class="card-body empty-state">
              <div class="icon">🧮</div>
              <h4>Enter loan details</h4>
              <p>Fill in the parameters and click Calculate</p>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class LoanCalculatorComponent {
  private fb = inject(FormBuilder);
  private svc = inject(LoanService);

  loading = signal(false);
  result = signal<LoanCalculatorResult | null>(null);

  form = this.fb.group({
    loanAmount: [null as number | null, [Validators.required, Validators.min(1)]],
    periodInMonths: [6, [Validators.required, Validators.min(1)]],
    phase1InterestRate: [5.0],
    phase2InterestRate: [3.0],
    phase1Months: [3]
  });

  calculate() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.svc.calculate(this.form.value as any).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  printSchedule() { window.print(); }
}
