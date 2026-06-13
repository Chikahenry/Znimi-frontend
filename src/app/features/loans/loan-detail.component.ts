import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoanService } from '../../core/services/api.services';
import { LoanDetailsResponse, LoanStatus, PaymentMethod } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { NairaPipe } from '../../shared/pipes/naira.pipe';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, StatusBadgeComponent, NairaPipe],
  template: `
    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else if (details()) {
      <div class="page-header flex-between">
        <div>
          <div style="display:flex;align-items:center;gap:10px">
            <h2>{{ details()!.loan.loanNumber }}</h2>
            <app-status-badge [status]="details()!.loan.status" />
          </div>
          <div class="breadcrumb">
            <a routerLink="/loans" style="color:var(--navy-600)">Loans</a> / {{ details()!.loan.loanNumber }}
          </div>
        </div>
        <div class="flex gap-2" style="flex-wrap:wrap">
          <!-- Export buttons -->
          <button class="btn btn-outline export-btn" (click)="exportPDF()" [disabled]="exporting()">
            <span *ngIf="!exporting()">📄 Export PDF</span>
            <span *ngIf="exporting()"><span class="spinner" style="width:13px;height:13px;border-width:2px;"></span></span>
          </button>
          <button class="btn btn-outline export-btn" (click)="exportExcel()" [disabled]="exporting()">📊 Export Excel</button>

          <!-- Action buttons -->
          @if (details()!.loan.status === LoanStatus.Pending) {
            <button class="btn btn-gold" (click)="showApproveModal = true">Approve Loan</button>
          }
          @if (details()!.loan.status === LoanStatus.Approved) {
            <button class="btn btn-success" (click)="showDisburseModal = true">Disburse Loan</button>
          }
          @if (details()!.loan.status === LoanStatus.Active || details()!.loan.status === LoanStatus.Overdue || details()!.loan.status === LoanStatus.Due) {
            <a routerLink="/payments/record" [queryParams]="{loanId: details()!.loan.loanId}" class="btn btn-gold">Record Payment</a>
          }
        </div>
      </div>

      <!-- Loan Summary -->
      <div class="stat-grid mb-4">
        <div class="stat-card">
          <div class="stat-label">Principal</div>
          <div class="stat-value money">{{ details()!.loan.approvedAmount | naira }}</div>
          <div class="stat-sub">Approved amount</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Outstanding Balance</div>
          <div class="stat-value money text-danger">{{ details()!.loan.outstandingPrincipal | naira }}</div>
          <div class="stat-sub">Remaining principal</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Paid</div>
          <div class="stat-value money text-success">{{ details()!.totalPaid | naira }}</div>
          <div class="stat-sub">Payments received</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Remaining</div>
          <div class="stat-value money">{{ details()!.totalRemaining | naira }}</div>
          <div class="stat-sub">Inc. interest + penalties</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Loan Details -->
        <div class="card">
          <div class="card-header"><h4>Loan Information</h4></div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-row"><span>Borrower</span>
                <a [routerLink]="['/borrowers', details()!.loan.borrowerId]" style="color:var(--navy-600)">{{ details()!.borrower?.fullName }}</a>
              </div>
              <div class="info-row"><span>Duration</span><span>{{ details()!.loan.durationInMonths }} months</span></div>
              <div class="info-row"><span>Phase 1 Rate</span><span>{{ details()!.loan.phase1InterestRate }}% / month</span></div>
              <div class="info-row"><span>Phase 2 Rate</span><span>{{ details()!.loan.phase2InterestRate }}% / month</span></div>
              <div class="info-row"><span>Grace Period</span><span>{{ details()!.loan.gracePeriodDays }} days</span></div>
              <div class="info-row"><span>Daily Penalty</span><span>{{ details()!.loan.dailyPenaltyAmount | naira }}</span></div>
              <div class="info-row"><span>Applied</span><span>{{ details()!.loan.applicationDate | date:'dd MMM yyyy' }}</span></div>
              @if (details()!.loan.approvalDate) {
                <div class="info-row"><span>Approved</span><span>{{ details()!.loan.approvalDate | date:'dd MMM yyyy' }}</span></div>
              }
              @if (details()!.loan.disbursementDate) {
                <div class="info-row"><span>Disbursed</span><span>{{ details()!.loan.disbursementDate | date:'dd MMM yyyy' }}</span></div>
              }
              @if (details()!.loan.firstPaymentDueDate) {
                <div class="info-row"><span>First Payment Due</span><span>{{ details()!.loan.firstPaymentDueDate | date:'dd MMM yyyy' }}</span></div>
              }
              @if (details()!.loan.notes) {
                <div class="info-row"><span>Notes</span><span>{{ details()!.loan.notes }}</span></div>
              }
            </div>
            @if (details()!.loan.approvedAmount > 0) {
              <div style="margin-top:16px">
                <div class="flex-between mb-1" style="font-size:12px">
                  <span style="color:var(--text-muted)">Repayment Progress</span>
                  <span style="font-weight:600">{{ getProgress() }}%</span>
                </div>
                <div class="progress-bar-wrap"><div class="progress-bar green" [style.width.%]="getProgress()"></div></div>
              </div>
            }
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Accruals -->
          <div class="card">
            <div class="card-header"><h4>Accruals</h4></div>
            <div class="card-body">
              <div class="info-grid">
                <div class="info-row"><span>Interest Accrued</span><span class="money text-warning">{{ details()!.loan.totalInterestAccrued | naira }}</span></div>
                <div class="info-row"><span>Penalties Accrued</span><span class="money text-danger">{{ details()!.loan.totalPenaltiesAccrued | naira }}</span></div>
              </div>
            </div>
          </div>

          <!-- Payment History -->
          <div class="card" style="flex:1">
            <div class="card-header">
              <h4>Payment History</h4>
              <a routerLink="/payments/record" [queryParams]="{loanId: details()!.loan.loanId}" class="btn btn-gold btn-sm">+ Record</a>
            </div>
            @if (details()!.paymentHistory?.length === 0) {
              <div class="empty-state" style="padding:24px"><p style="color:var(--text-muted)">No payments recorded yet</p></div>
            } @else {
              <div class="table-wrap">
                <table class="data-table">
                  <thead><tr><th>Date</th><th>Amount</th><th>Method</th></tr></thead>
                  <tbody>
                    @for (p of details()!.paymentHistory; track p.paymentId) {
                      <tr>
                        <td>{{ p.paymentDate | date:'dd MMM yyyy' }}</td>
                        <td class="money">{{ p.amount | naira }}</td>
                        <td>{{ PaymentMethod[p.paymentMethod] }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Repayment Schedule -->
        @if ((details()!.repaymentSchedule?.length ?? 0) > 0) { 
         <div class="card mt-4">
          <div class="card-header">
            <h4>Repayment Schedule</h4>
            <div style="display:flex;gap:8px;align-items:center">
              <span class="sched-legend paid">● Paid</span>
              <span class="sched-legend overdue">● Overdue</span>
              <span class="sched-legend pending">● Pending</span>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due Date</th>
                  <th>Phase</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Total Due</th>
                  <th>Balance After</th>
                  <th>Status</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                @for (s of details()!.repaymentSchedule; track s.scheduleId; let i = $index) {
                  <tr [class.row-paid]="s.isPaid" [class.row-overdue]="!s.isPaid && isPast(s.dueDate)">
                    <td>{{ i + 1 }}</td>
                    <td>{{ s.dueDate | date:'dd MMM yyyy' }}</td>
                    <td style="font-size:11px;color:var(--text-muted)">{{ s.interestPhase }}</td>
                    <td class="money">{{ s.principalDue | naira }}</td>
                    <td class="money">{{ s.interestDue | naira }}</td>
                    <td class="money" style="font-weight:600">{{ s.totalDue | naira }}</td>
                    <td class="money" style="color:var(--text-muted)">{{ s.balanceAfterPayment | naira }}</td>
                    <td>
                      @if (s.isPaid) { <span class="sched-badge paid">✓ Paid</span> }
                      @else if (isPast(s.dueDate)) { <span class="sched-badge overdue">Overdue</span> }
                      @else { <span class="sched-badge pending">Pending</span> }
                    </td>
                    <td class="money">{{ s.amountPaid | naira }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Schedule totals footer -->
          <div class="sched-footer">
            <div class="sf-item"><span>Total Installments</span><strong>{{ details()!.repaymentSchedule.length }}</strong></div>
            <div class="sf-item"><span>Paid</span><strong style="color:var(--success)">{{ getPaidCount() }}</strong></div>
            <div class="sf-item"><span>Remaining</span><strong style="color:var(--warning)">{{ details()!.repaymentSchedule.length - getPaidCount() }}</strong></div>
            <div class="sf-item"><span>Outstanding Principal</span><strong class="money text-danger">{{ details()!.loan.outstandingPrincipal | naira }}</strong></div>
          </div>
        </div>
      }
    }

    <!-- Approve Modal -->
    @if (showApproveModal) {
      <div class="modal-backdrop" (click)="showApproveModal = false">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Approve Loan</h3><button class="btn btn-icon" (click)="showApproveModal = false">✕</button></div>
          <form [formGroup]="approveForm" (ngSubmit)="approveLoan()">
            <div class="modal-body">
              <div class="form-group"><label class="form-label">Approved Amount (₦) *</label><input type="number" class="form-control" formControlName="approvedAmount"></div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Phase 1 Rate (%)</label><input type="number" class="form-control" formControlName="phase1InterestRate" step="0.1"></div>
                <div class="form-group"><label class="form-label">Phase 2 Rate (%)</label><input type="number" class="form-control" formControlName="phase2InterestRate" step="0.1"></div>
              </div>
              <div class="form-group"><label class="form-label">Repayment Day of Month</label><input type="number" class="form-control" formControlName="repaymentDay" min="1" max="28"></div>
              <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" formControlName="notes" rows="2"></textarea></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="showApproveModal = false">Cancel</button>
              <button type="submit" class="btn btn-gold" [disabled]="modalLoading()">
                @if (modalLoading()) { <span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> } Approve
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Disburse Modal -->
    @if (showDisburseModal) {
      <div class="modal-backdrop" (click)="showDisburseModal = false">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Disburse Loan</h3><button class="btn btn-icon" (click)="showDisburseModal = false">✕</button></div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Disbursement Method *</label>
              <select class="form-control" [(ngModel)]="disburseMethod">
                <option value="0">Cash</option><option value="1">Bank Transfer</option>
                <option value="2">Mobile Payment</option><option value="3">Check</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="showDisburseModal = false">Cancel</button>
            <button class="btn btn-success" [disabled]="modalLoading()" (click)="disburseLoan()">
              @if (modalLoading()) { <span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> } Confirm Disbursement
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .export-btn { min-width: 120px; }
    .info-grid { display: flex; flex-direction: column; gap: 10px; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
    .info-row:last-child { border-bottom: none; }
    .info-row span:first-child { color: var(--text-muted); font-size: 12px; }
    .row-paid { background: #f0fdf4; }
    .row-overdue { background: #fff5f5; }

    .sched-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .sched-badge.paid { background: #dcfce7; color: #15803d; }
    .sched-badge.overdue { background: #fee2e2; color: #b91c1c; }
    .sched-badge.pending { background: #f1f5f9; color: #64748b; }

    .sched-legend { font-size: 11px; font-weight: 500; }
    .sched-legend.paid { color: #15803d; }
    .sched-legend.overdue { color: #b91c1c; }
    .sched-legend.pending { color: #64748b; }

    .sched-footer {
      display: flex; gap: 0; border-top: 1px solid var(--border);
    }
    .sf-item {
      flex: 1; padding: 12px 16px; display: flex; flex-direction: column; gap: 2px;
      border-right: 1px solid var(--border); background: #f8fafc;
    }
    .sf-item:last-child { border-right: none; }
    .sf-item span { font-size: 11px; color: var(--text-muted); }
    .sf-item strong { font-size: 14px; font-weight: 700; }
  `]
})
export class LoanDetailComponent implements OnInit {
  private svc = inject(LoanService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  LoanStatus = LoanStatus;
  PaymentMethod = PaymentMethod;

  loading = signal(true);
  modalLoading = signal(false);
  exporting = signal(false);
  details = signal<LoanDetailsResponse | null>(null);
  showApproveModal = false;
  showDisburseModal = false;
  disburseMethod = '0';

  approveForm = this.fb.group({
    approvedAmount: [null as number | null, Validators.required],
    phase1InterestRate: [5.0],
    phase2InterestRate: [3.0],
    repaymentDay: [15],
    notes: ['']
  });

  ngOnInit() { this.loadLoan(); }

  loadLoan() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: d => {
        this.details.set(d);
        this.approveForm.patchValue({ approvedAmount: d.loan.requestedAmount, phase1InterestRate: d.loan.phase1InterestRate, phase2InterestRate: d.loan.phase2InterestRate });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getProgress(): number {
    const d = this.details();
    if (!d || d.loan.approvedAmount === 0) return 0;
    return Math.round(((d.loan.approvedAmount - d.loan.outstandingPrincipal) / d.loan.approvedAmount) * 100);
  }

  getPaidCount(): number {
    return this.details()?.repaymentSchedule?.filter((s: any) => s.isPaid).length ?? 0;
  }

  isPast(date: string): boolean { return new Date(date) < new Date(); }

  fmt(n: number): string {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);
  }

  approveLoan() {
    if (this.approveForm.invalid) return;
    this.modalLoading.set(true);
    this.svc.approve({ loanId: this.details()!.loan.loanId, ...this.approveForm.value as any }).subscribe({
      next: () => { this.modalLoading.set(false); this.showApproveModal = false; this.loadLoan(); },
      error: () => this.modalLoading.set(false)
    });
  }

  disburseLoan() {
    this.modalLoading.set(true);
    this.svc.disburse({ loanId: this.details()!.loan.loanId, disbursementMethod: +this.disburseMethod }).subscribe({
      next: () => { this.modalLoading.set(false); this.showDisburseModal = false; this.loadLoan(); },
      error: () => this.modalLoading.set(false)
    });
  }

  // ─── PDF EXPORT ──────────────────────────────────────────────────────────
  async exportPDF() {
    const d = this.details();
    if (!d) return;
    this.exporting.set(true);
    try {
      const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' as any);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210; const margin = 14; const col = pageW - margin * 2;
      const now = new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });

      // Header
      doc.setFillColor(13, 27, 46); doc.rect(0, 0, pageW, 18, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(`LOANAPP — Loan Statement: ${d.loan.loanNumber}`, margin, 12);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(`Generated: ${now}`, pageW - margin, 12, { align: 'right' });

      let y = 26;
      const section = (title: string) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(13, 27, 46);
        doc.text(title, margin, y); y += 2;
        doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.5); doc.line(margin, y, margin + col, y); y += 5;
      };
      const row = (label: string, value: string) => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(label, margin + 2, y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30); doc.text(value, pageW - margin - 2, y, { align: 'right' });
        y += 5.5;
      };

      // Loan summary
      section('Loan Summary');
      row('Loan Number', d.loan.loanNumber);
      row('Borrower', d.borrower?.fullName || '—');
      row('Status', LoanStatus[d.loan.status]);
      row('Approved Amount', this.fmt(d.loan.approvedAmount));
      row('Outstanding Balance', this.fmt(d.loan.outstandingPrincipal));
      row('Total Paid', this.fmt(d.totalPaid));
      row('Total Remaining (incl. interest)', this.fmt(d.totalRemaining));
      row('Interest Accrued', this.fmt(d.loan.totalInterestAccrued));
      row('Penalties Accrued', this.fmt(d.loan.totalPenaltiesAccrued));
      row('Repayment Progress', `${this.getProgress()}%`);
      y += 3;

      // Loan details
      section('Loan Details');
      row('Duration', `${d.loan.durationInMonths} months`);
      row('Phase 1 Interest Rate', `${d.loan.phase1InterestRate}% / month`);
      row('Phase 2 Interest Rate', `${d.loan.phase2InterestRate}% / month`);
      row('Grace Period', `${d.loan.gracePeriodDays} days`);
      row('Daily Penalty', this.fmt(d.loan.dailyPenaltyAmount));
      if (d.loan.disbursementDate) row('Disbursement Date', new Date(d.loan.disbursementDate).toLocaleDateString('en-NG'));
      if (d.loan.firstPaymentDueDate) row('First Payment Due', new Date(d.loan.firstPaymentDueDate).toLocaleDateString('en-NG'));
      y += 3;

      // Repayment Schedule
      if (d.repaymentSchedule?.length > 0) {
        section('Repayment Schedule');
        const headers = ['#', 'Due Date', 'Phase', 'Principal', 'Interest', 'Total Due', 'Balance After', 'Status', 'Paid'];
        const widths = [8, 22, 20, 22, 20, 22, 24, 16, 22];
        const hH = 6;
        doc.setFillColor(13, 27, 46); doc.rect(margin, y, col, hH, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
        let xc = margin + 1;
        headers.forEach((h, i) => { doc.text(h, xc, y + 4); xc += widths[i]; });
        y += hH;

        d.repaymentSchedule.forEach((s: any, idx: number) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const rH = 5.5;
          if (s.isPaid) doc.setFillColor(240, 253, 244);
          else if (!s.isPaid && this.isPast(s.dueDate)) doc.setFillColor(255, 245, 245);
          else if (idx % 2 === 0) doc.setFillColor(249, 250, 251);
          else doc.setFillColor(255, 255, 255);
          doc.rect(margin, y, col, rH, 'F');
          doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(30, 30, 30);
          const cells = [
            String(idx + 1),
            new Date(s.dueDate).toLocaleDateString('en-NG'),
            (s.interestPhase || '').substring(0, 12),
            this.fmt(s.principalDue),
            this.fmt(s.interestDue),
            this.fmt(s.totalDue),
            this.fmt(s.balanceAfterPayment),
            s.isPaid ? 'Paid' : this.isPast(s.dueDate) ? 'Overdue' : 'Pending',
            this.fmt(s.amountPaid)
          ];
          xc = margin + 1;
          cells.forEach((c, i) => { doc.text(String(c).substring(0, 14), xc, y + 3.8); xc += widths[i]; });
          y += rH;
        });
        y += 4;
      }

      // Payment history
      if (d.paymentHistory?.length > 0) {
        section('Payment History');
        const hH = 6;
        doc.setFillColor(13, 27, 46); doc.rect(margin, y, col, hH, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
        doc.text('Date', margin + 2, y + 4); doc.text('Amount', margin + 50, y + 4); doc.text('Method', margin + 100, y + 4);
        y += hH;
        d.paymentHistory.forEach((p: any, ri: number) => {
          if (y > 270) { doc.addPage(); y = 20; }
          if (ri % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, col, 5.5, 'F'); }
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30);
          doc.text(new Date(p.paymentDate).toLocaleDateString('en-NG'), margin + 2, y + 4);
          doc.text(this.fmt(p.amount), margin + 50, y + 4);
          doc.text(PaymentMethod[p.paymentMethod] || '—', margin + 100, y + 4);
          y += 5.5;
        });
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFillColor(13, 27, 46); doc.rect(0, 287, pageW, 10, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text(`${d.loan.loanNumber} — ${d.borrower?.fullName} — Confidential`, margin, 293);
        doc.text(`Page ${i} of ${pages}`, pageW - margin, 293, { align: 'right' });
      }

      doc.save(`LoanStatement_${d.loan.loanNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
      alert('PDF export failed. Please try again.');
    } finally {
      this.exporting.set(false);
    }
  }

  // ─── EXCEL EXPORT ────────────────────────────────────────────────────────
  async exportExcel() {
    const d = this.details();
    if (!d) return;
    this.exporting.set(true);
    try {
      const XLSX = await import('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' as any);
      const wb = XLSX.utils.book_new();
      const now = new Date().toLocaleDateString('en-NG');

      // Sheet 1: Summary
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        [`Loan Statement — ${d.loan.loanNumber}`],
        [`Generated: ${now}`],
        [],
        ['Loan Number', d.loan.loanNumber],
        ['Borrower', d.borrower?.fullName],
        ['Status', LoanStatus[d.loan.status]],
        ['Approved Amount (NGN)', d.loan.approvedAmount],
        ['Outstanding Balance (NGN)', d.loan.outstandingPrincipal],
        ['Total Paid (NGN)', d.totalPaid],
        ['Total Remaining (NGN)', d.totalRemaining],
        ['Interest Accrued (NGN)', d.loan.totalInterestAccrued],
        ['Penalties Accrued (NGN)', d.loan.totalPenaltiesAccrued],
        ['Repayment Progress (%)', this.getProgress()],
        [],
        ['Duration (Months)', d.loan.durationInMonths],
        ['Phase 1 Rate (% / month)', d.loan.phase1InterestRate],
        ['Phase 2 Rate (% / month)', d.loan.phase2InterestRate],
        ['Grace Period (Days)', d.loan.gracePeriodDays],
        ['Daily Penalty (NGN)', d.loan.dailyPenaltyAmount],
        ['Disbursement Date', d.loan.disbursementDate ? new Date(d.loan.disbursementDate).toLocaleDateString('en-NG') : '—'],
        ['First Payment Due', d.loan.firstPaymentDueDate ? new Date(d.loan.firstPaymentDueDate).toLocaleDateString('en-NG') : '—'],
      ]), 'Loan Summary');

      // Sheet 2: Repayment Schedule
      if (d.repaymentSchedule?.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
          ['#', 'Due Date', 'Interest Phase', 'Principal (NGN)', 'Interest (NGN)', 'Total Due (NGN)', 'Balance After (NGN)', 'Status', 'Amount Paid (NGN)'],
          ...d.repaymentSchedule.map((s: any, i: number) => [
            i + 1,
            new Date(s.dueDate).toLocaleDateString('en-NG'),
            s.interestPhase,
            s.principalDue,
            s.interestDue,
            s.totalDue,
            s.balanceAfterPayment,
            s.isPaid ? 'Paid' : this.isPast(s.dueDate) ? 'Overdue' : 'Pending',
            s.amountPaid
          ])
        ]), 'Repayment Schedule');
      }

      // Sheet 3: Payment History
      if (d.paymentHistory?.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
          ['Payment Date', 'Amount (NGN)', 'Method'],
          ...d.paymentHistory.map((p: any) => [
            new Date(p.paymentDate).toLocaleDateString('en-NG'),
            p.amount,
            PaymentMethod[p.paymentMethod] || '—'
          ])
        ]), 'Payment History');
      }

      XLSX.writeFile(wb, `LoanStatement_${d.loan.loanNumber}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error('Excel export failed', e);
      alert('Excel export failed. Please try again.');
    } finally {
      this.exporting.set(false);
    }
  }
}
