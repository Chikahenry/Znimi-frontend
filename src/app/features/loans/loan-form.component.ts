import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoanService, BorrowerService } from '../../core/services/api.services';
import { NairaPipe } from '../../shared/pipes/naira.pipe';

@Component({
  selector: 'app-loan-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, NairaPipe],
  template: `
    <div class="page-header">
      <h2>New Loan Application</h2>
      <div class="breadcrumb">
        <a routerLink="/loans" style="color:var(--navy-600)">Loans</a> / New Application
      </div>
    </div>

    @if (success()) {
      <div class="alert alert-success">✓ Loan application submitted! Redirecting...</div>
    }
    @if (error()) {
      <div class="alert alert-danger">⚠ {{ error() }}</div>
    }

    <div class="grid-2">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="card">
          <div class="card-header"><h4>Loan Details</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Borrower ID *</label>
              <input type="number" class="form-control" formControlName="borrowerId" placeholder="Enter borrower ID">
              @if (hasError('borrowerId')) { <div class="invalid-feedback">Borrower ID required</div> }
              @if (borrowerName()) {
                <div class="mt-1" style="font-size:12px;color:var(--success)">✓ {{ borrowerName() }}</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Requested Amount (₦) *</label>
              <input type="number" class="form-control" formControlName="requestedAmount" placeholder="e.g. 100000" (change)="updatePreview()">
              @if (hasError('requestedAmount')) { <div class="invalid-feedback">Amount required</div> }
            </div>

            <div class="form-group">
              <label class="form-label">Duration (months) *</label>
              <input type="number" class="form-control" formControlName="durationInMonths" placeholder="e.g. 6" (change)="updatePreview()">
              @if (hasError('durationInMonths')) { <div class="invalid-feedback">Duration required</div> }
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Phase 1 Rate (% monthly)</label>
                <input type="number" class="form-control" formControlName="phase1InterestRate" step="0.1" (change)="updatePreview()">
              </div>
              <div class="form-group">
                <label class="form-label">Phase 2 Rate (% monthly)</label>
                <input type="number" class="form-control" formControlName="phase2InterestRate" step="0.1" (change)="updatePreview()">
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Grace Period (days)</label>
                <input type="number" class="form-control" formControlName="gracePeriodDays">
              </div>
              <div class="form-group">
                <label class="form-label">Daily Penalty (₦)</label>
                <input type="number" class="form-control" formControlName="dailyPenaltyAmount">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" formControlName="notes" rows="3" placeholder="Purpose of loan, additional notes..."></textarea>
            </div>

            <div class="flex gap-2">
              <button type="submit" class="btn btn-gold btn-lg" [disabled]="loading() || form.invalid">
                @if (loading()) { <span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> }
                Submit Application
              </button>
              <a routerLink="/loans" class="btn btn-outline btn-lg">Cancel</a>
            </div>
          </div>
        </div>
      </form>

      <!-- Quick Preview -->
      <div>
        @if (preview()) {
          <div class="card">
            <div class="card-header"><h4>🧮 Loan Preview</h4></div>
            <div class="card-body">
              <div class="preview-rows">
                <div class="preview-row">
                  <span>Loan Amount</span>
                  <span class="money">{{ preview()!.loanAmount | naira }}</span>
                </div>
                <div class="preview-row">
                  <span>Total Interest</span>
                  <span class="money text-warning">{{ preview()!.totalInterest | naira }}</span>
                </div>
                <div class="preview-row total">
                  <span>Total Repayment</span>
                  <span class="money">{{ preview()!.totalRepayment | naira }}</span>
                </div>
                <div class="preview-row">
                  <span>Avg Monthly</span>
                  <span class="money">{{ preview()!.monthlyAveragePayment | naira }}</span>
                </div>
                <div class="preview-row">
                  <span>Effective Rate</span>
                  <span>{{ preview()!.summary?.effectiveInterestRate?.toFixed(2) }}%</span>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="card">
            <div class="card-body empty-state" style="padding:32px">
              <div class="icon">🧮</div>
              <h4>Loan Preview</h4>
              <p>Fill in the loan details to see a quick estimate</p>
            </div>
          </div>
        }

        <div class="card mt-4">
          <div class="card-header"><h4>💡 Process Guide</h4></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:12px">
              @for (step of steps; track step.n) {
                <div style="display:flex;gap:10px;align-items:flex-start">
                  <div style="width:24px;height:24px;border-radius:50%;background:var(--navy-900);color:var(--gold-400);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">
                    {{ step.n }}
                  </div>
                  <div>
                    <div style="font-size:13px;font-weight:600">{{ step.title }}</div>
                    <div style="font-size:11px;color:var(--text-muted)">{{ step.desc }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-rows { display: flex; flex-direction: column; gap: 10px; }
    .preview-row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .preview-row:last-child { border-bottom: none; }
    .preview-row.total { font-weight: 700; font-size: 15px; }
  `]
})
export class LoanFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private loanSvc = inject(LoanService);
  private borrowerSvc = inject(BorrowerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  success = signal(false);
  error = signal('');
  preview = signal<any>(null);
  borrowerName = signal('');

  steps = [
    { n: 1, title: 'Submit Application', desc: 'Fill this form with borrower details and loan terms' },
    { n: 2, title: 'Approval', desc: 'Loan officer reviews and approves with final amount' },
    { n: 3, title: 'Disbursement', desc: 'Approved loan is disbursed to borrower' },
    { n: 4, title: 'Repayment', desc: 'Record payments monthly against the schedule' },
  ];

  form = this.fb.group({
    borrowerId: [null as number | null, Validators.required],
    requestedAmount: [null as number | null, [Validators.required, Validators.min(1)]],
    durationInMonths: [null as number | null, [Validators.required, Validators.min(1)]],
    phase1InterestRate: [5.0],
    phase2InterestRate: [3.0],
    gracePeriodDays: [3],
    dailyPenaltyAmount: [500],
    notes: ['']
  });

  ngOnInit() {
    const bid = this.route.snapshot.queryParamMap.get('borrowerId');
    if (bid) {
      this.form.patchValue({ borrowerId: +bid });
      this.loadBorrower(+bid);
    }
  }

  loadBorrower(id: number) {
    this.borrowerSvc.getById(id).subscribe({
      next: b => this.borrowerName.set(b.fullName),
      error: () => this.borrowerName.set('')
    });
  }

  updatePreview() {
    const v = this.form.value;
    if (!v.requestedAmount || !v.durationInMonths) { this.preview.set(null); return; }
    this.loanSvc.calculate({
      loanAmount: v.requestedAmount!,
      periodInMonths: v.durationInMonths!,
      phase1InterestRate: v.phase1InterestRate || 5,
      phase2InterestRate: v.phase2InterestRate || 3,
    }).subscribe({ next: r => this.preview.set(r), error: () => {} });
  }

  hasError(f: string) { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.loanSvc.createApplication(this.form.value as any).subscribe({
      next: (loan: any) => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/loans', loan.loanId]), 1500);
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Failed to submit application');
        this.loading.set(false);
      }
    });
  }
}
