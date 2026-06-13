import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService, LoanService } from '../../core/services/api.services';
import { NairaPipe } from '../../shared/pipes/naira.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-record-payment',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, NairaPipe, StatusBadgeComponent],
  template: `
    <div class="page-header">
      <h2>Record Payment</h2>
      <div class="breadcrumb">
        <a routerLink="/payments" style="color:var(--navy-600)">Payments</a> / Record
      </div>
    </div>

    @if (success()) {
      <div class="alert alert-success">
        ✓ Payment of {{ lastAmount() | naira }} recorded successfully!
        <a routerLink="/payments" style="margin-left:8px;color:var(--success);font-weight:600">View all payments →</a>
      </div>
    }
    @if (error()) {
      <div class="alert alert-danger">⚠ {{ error() }}</div>
    }

    <div class="grid-2">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="card">
          <div class="card-header"><h4>Payment Details</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Loan ID *</label>
              <input type="number" class="form-control" formControlName="loanId" placeholder="Enter loan ID"
                     (blur)="loadLoanInfo()">
              @if (form.get('loanId')?.touched && form.get('loanId')?.invalid) {
                <div class="invalid-feedback">Loan ID is required</div>
              }
            </div>

            @if (loanInfo()) {
              <div class="loan-preview">
                <div class="flex-between" style="margin-bottom:6px">
                  <span style="font-weight:600">{{ loanInfo()!.loan.loanNumber }}</span>
                  <app-status-badge [status]="loanInfo()!.loan.status" />
                </div>
                <div class="flex-between" style="font-size:12px;color:var(--text-muted)">
                  <span>Outstanding: <strong class="money text-danger">{{ loanInfo()!.loan.outstandingPrincipal | naira }}</strong></span>
                  <span>Borrower: <strong>{{ loanInfo()!.borrower?.fullName }}</strong></span>
                </div>
              </div>
            }

            <div class="form-group">
              <label class="form-label">Payment Amount (₦) *</label>
              <input type="number" class="form-control" formControlName="amount" placeholder="e.g. 50000">
              @if (form.get('amount')?.touched && form.get('amount')?.invalid) {
                <div class="invalid-feedback">Amount is required</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Payment Method *</label>
              <select class="form-control" formControlName="paymentMethod">
                <option value="0">Cash</option>
                <option value="1">Bank Transfer</option>
                <option value="2">Mobile Payment</option>
                <option value="3">Check</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Date</label>
              <input type="date" class="form-control" formControlName="paymentDate">
            </div>

            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" formControlName="notes" rows="2" placeholder="Optional notes about this payment"></textarea>
            </div>

            <div class="flex gap-2">
              <button type="submit" class="btn btn-gold btn-lg" [disabled]="loading() || form.invalid">
                @if (loading()) { <span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> }
                Record Payment
              </button>
              <a routerLink="/payments" class="btn btn-outline btn-lg">Cancel</a>
            </div>
          </div>
        </div>
      </form>

      <!-- Info panel -->
      <div>
        @if (loanInfo()) {
          <div class="card">
            <div class="card-header"><h4>Loan Summary</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:10px">
                <div class="flex-between" style="font-size:13px;padding-bottom:8px;border-bottom:1px solid var(--border)">
                  <span style="color:var(--text-muted)">Principal</span>
                  <span class="money">{{ loanInfo()!.loan.approvedAmount | naira }}</span>
                </div>
                <div class="flex-between" style="font-size:13px;padding-bottom:8px;border-bottom:1px solid var(--border)">
                  <span style="color:var(--text-muted)">Outstanding</span>
                  <span class="money text-danger">{{ loanInfo()!.loan.outstandingPrincipal | naira }}</span>
                </div>
                <div class="flex-between" style="font-size:13px;padding-bottom:8px;border-bottom:1px solid var(--border)">
                  <span style="color:var(--text-muted)">Interest Accrued</span>
                  <span class="money text-warning">{{ loanInfo()!.loan.totalInterestAccrued | naira }}</span>
                </div>
                <div class="flex-between" style="font-size:13px;padding-bottom:8px;border-bottom:1px solid var(--border)">
                  <span style="color:var(--text-muted)">Penalties</span>
                  <span class="money text-danger">{{ loanInfo()!.loan.totalPenaltiesAccrued | naira }}</span>
                </div>
                <div class="flex-between" style="font-size:15px;font-weight:700">
                  <span>Total Due</span>
                  <span class="money">{{ loanInfo()!.totalRemaining | naira }}</span>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="card">
            <div class="card-body empty-state" style="padding:32px">
              <div class="icon">💡</div>
              <h4>Loan Info</h4>
              <p>Enter a loan ID to see the outstanding balance and details</p>
            </div>
          </div>
        }

        <div class="card mt-4">
          <div class="card-header"><h4>Payment Guide</h4></div>
          <div class="card-body" style="font-size:13px;color:var(--text-secondary);line-height:1.8">
            <p>Payments are applied in this order:</p>
            <ol style="margin-left:16px;margin-top:8px;display:flex;flex-direction:column;gap:4px">
              <li>Penalties first</li>
              <li>Accrued interest</li>
              <li>Principal balance</li>
            </ol>
            <p style="margin-top:12px;color:var(--text-muted)">A receipt will be auto-generated after recording.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loan-preview {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
    }
  `]
})
export class RecordPaymentComponent implements OnInit {
  private fb = inject(FormBuilder);
  private svc = inject(PaymentService);
  private loanSvc = inject(LoanService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  success = signal(false);
  error = signal('');
  loanInfo = signal<any>(null);
  lastAmount = signal(0);

  form = this.fb.group({
    loanId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    paymentMethod: ['0', Validators.required],
    paymentDate: [new Date().toISOString().split('T')[0]],
    notes: ['']
  });

  ngOnInit() {
    const loanId = this.route.snapshot.queryParamMap.get('loanId');
    if (loanId) {
      this.form.patchValue({ loanId: +loanId });
      this.loadLoanInfo();
    }
  }

  loadLoanInfo() {
    const id = this.form.value.loanId;
    if (!id) { this.loanInfo.set(null); return; }
    this.loanSvc.getById(+id).subscribe({
      next: info => this.loanInfo.set(info),
      error: () => this.loanInfo.set(null)
    });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.value;
    this.lastAmount.set(v.amount!);

    this.svc.record({
      loanId: v.loanId!,
      amount: v.amount!,
      paymentMethod: +v.paymentMethod!,
      paymentDate: v.paymentDate || undefined,
      notes: v.notes || undefined
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        this.form.reset({ paymentMethod: '0', paymentDate: new Date().toISOString().split('T')[0] });
        this.loanInfo.set(null);
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Failed to record payment');
        this.loading.set(false);
      }
    });
  }
}
