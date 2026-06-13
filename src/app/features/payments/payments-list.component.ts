import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../core/services/api.services';
import { Payment, PaymentMethod } from '../../core/models/models';
import { NairaPipe } from '../../shared/pipes/naira.pipe';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NairaPipe],
  template: `
    <div class="page-header flex-between">
      <div>
        <h2>Payments</h2>
        <div class="breadcrumb">All payment transactions</div>
      </div>
      <a routerLink="/payments/record" class="btn btn-gold">+ Record Payment</a>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end">
        <div class="form-group" style="margin:0">
          <label class="form-label">From Date</label>
          <input type="date" class="form-control" [(ngModel)]="fromDate" (change)="loadPayments()">
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">To Date</label>
          <input type="date" class="form-control" [(ngModel)]="toDate" (change)="loadPayments()">
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Loan ID</label>
          <input type="number" class="form-control" [(ngModel)]="loanIdFilter" placeholder="Filter by loan ID">
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary" (click)="loadPayments()">Filter</button>
          <button class="btn btn-outline" (click)="clearFilters()">Clear</button>
        </div>
      </div>
    </div>

    <div class="card">
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      } @else if (payments().length === 0) {
        <div class="empty-state">
          <div class="icon">💳</div>
          <h4>No payments found</h4>
          <p>Record a payment to get started</p>
          <a routerLink="/payments/record" class="btn btn-gold mt-3">+ Record Payment</a>
        </div>
      } @else {
        <!-- Totals bar -->
        <div style="padding:12px 20px;background:var(--surface-2);border-bottom:1px solid var(--border);display:flex;gap:32px">
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">Total Collected</div>
            <div class="money" style="font-size:1.1rem;font-weight:700;color:var(--success)">{{ totalAmount() | naira }}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">Transactions</div>
            <div style="font-size:1.1rem;font-weight:700">{{ totalCount() }}</div>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Loan #</th>
                <th>Borrower</th>
                <th>Amount</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Penalty</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (p of payments(); track p.paymentId) {
                <tr>
                  <td><code style="font-size:11px">{{ p.receiptNumber || '#' + p.paymentId }}</code></td>
                  <td>
                    <a [routerLink]="['/loans', p.loanId]" style="color:var(--navy-600);text-decoration:none">
                      {{ p.loanNumber || 'LN-' + p.loanId }}
                    </a>
                  </td>
                  <td>{{ p.borrowerName || '—' }}</td>
                  <td class="money" style="font-weight:600">{{ p.amount | naira }}</td>
                  <td class="money">{{ p.principalPaid | naira }}</td>
                  <td class="money text-warning">{{ p.interestPaid | naira }}</td>
                  <td class="money text-danger">{{ p.penaltiesPaid | naira }}</td>
                  <td style="font-size:12px">{{ PaymentMethod[p.paymentMethod] }}</td>
                  <td>{{ p.paymentDate | date:'dd MMM yyyy' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span style="color:var(--text-muted);font-size:12px;margin-right:auto">
            Showing {{ payments().length }} of {{ totalCount() }} payments
          </span>
          <button class="page-btn" [disabled]="page() === 1" (click)="changePage(page()-1)">‹ Prev</button>
          @for (p of getPages(); track p) {
            <button class="page-btn" [class.active]="p === page()" (click)="changePage(p)">{{ p }}</button>
          }
          <button class="page-btn" [disabled]="page() >= totalPages" (click)="changePage(page()+1)">Next ›</button>
        </div>
      }
    </div>
  `
})
export class PaymentsListComponent implements OnInit {
  private svc = inject(PaymentService);
  PaymentMethod = PaymentMethod;

  loading = signal(true);
  payments = signal<Payment[]>([]);
  totalCount = signal(0);
  page = signal(1);
  pageSize = 20;
  fromDate = '';
  toDate = '';
  loanIdFilter: number | null = null;

  get totalPages() { return Math.ceil(this.totalCount() / this.pageSize); }
  getPages() {
    const t = this.totalPages;
    const p = this.page();
    const range: number[] = [];
    for (let i = Math.max(1, p-2); i <= Math.min(t, p+2); i++) range.push(i);
    return range;
  }

  totalAmount() {
    return this.payments().reduce((sum, p) => sum + p.amount, 0);
  }

  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.loading.set(true);
    const req: any = { page: this.page(), pageSize: this.pageSize };
    if (this.fromDate) req.fromDate = this.fromDate;
    if (this.toDate) req.toDate = this.toDate;
    if (this.loanIdFilter) req.loanId = this.loanIdFilter;

    this.svc.filter(req).subscribe({
      next: res => {
        this.payments.set(res.items || res);
        this.totalCount.set(res.totalCount || (res.items || res).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  clearFilters() {
    this.fromDate = '';
    this.toDate = '';
    this.loanIdFilter = null;
    this.page.set(1);
    this.loadPayments();
  }

  changePage(p: number) { this.page.set(p); this.loadPayments(); }
}
