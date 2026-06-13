import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../core/services/api.services';
import { Loan, LoanStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { NairaPipe } from '../../shared/pipes/naira.pipe';

@Component({
  selector: 'app-loans-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StatusBadgeComponent, NairaPipe],
  template: `
    <div class="page-header flex-between">
      <div>
        <h2>Loans</h2>
        <div class="breadcrumb">Track and manage all loan applications</div>
      </div>
      <a routerLink="/loans/new" class="btn btn-gold">+ New Application</a>
    </div>

    <!-- Status tab pills -->
    <div class="status-tabs mb-4">
      <button class="tab" [class.active]="statusFilter === ''" (click)="setStatus('')">All</button>
      <button class="tab" [class.active]="statusFilter === '1'" (click)="setStatus('1')">Pending</button>
      <button class="tab" [class.active]="statusFilter === '2'" (click)="setStatus('2')">Approved</button>
      <button class="tab" [class.active]="statusFilter === '3'" (click)="setStatus('3')">Active</button>
      <button class="tab overdue" [class.active]="statusFilter === '6'" (click)="setStatus('6')">Overdue</button>
      <button class="tab" [class.active]="statusFilter === '9'" (click)="setStatus('9')">Defaulted</button>
      <button class="tab" [class.active]="statusFilter === '0'" (click)="setStatus('0')">Closed</button>
    </div>

    <!-- Search bar -->
    <div class="card mb-4">
      <div class="card-body" style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end">
        <div class="form-group" style="margin:0">
          <label class="form-label">Search loans</label>
          <input class="form-control" [(ngModel)]="search" placeholder="Loan number, borrower name..." (input)="onSearch()">
        </div>
        <button class="btn btn-outline" (click)="clearFilters()">Clear</button>
      </div>
    </div>

    <div class="card">
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      } @else if (loans().length === 0) {
        <div class="empty-state">
          <div class="icon">📋</div>
          <h4>No loans found</h4>
          <p>Create your first loan application</p>
          <a routerLink="/loans/new" class="btn btn-gold mt-3">+ New Application</a>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Borrower</th>
                <th>Amount</th>
                <th>Outstanding</th>
                <th>Interest %</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (loan of loans(); track loan.loanId) {
                <tr>
                  <td><code style="font-size:12px">{{ loan.loanNumber }}</code></td>
                  <td>
                    <a [routerLink]="['/borrowers', loan.borrowerId]" style="color:var(--navy-600);text-decoration:none;font-weight:500">
                      {{ loan.borrowerName || 'Borrower #' + loan.borrowerId }}
                    </a>
                  </td>
                  <td class="money">{{ loan.approvedAmount | naira }}</td>
                  <td class="money" [class.text-danger]="loan.outstandingPrincipal > 0">
                    {{ loan.outstandingPrincipal | naira }}
                  </td>
                  <td>{{ loan.phase1InterestRate }}% / {{ loan.phase2InterestRate }}%</td>
                  <td>{{ loan.durationInMonths }}m</td>
                  <td><app-status-badge [status]="loan.status" /></td>
                  <td>{{ loan.applicationDate | date:'dd MMM yy' }}</td>
                  <td>
                    <a [routerLink]="['/loans', loan.loanId]" class="btn btn-outline btn-sm">View</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span style="color:var(--text-muted);font-size:12px;margin-right:auto">
            Showing {{ loans().length }} of {{ totalCount() }} loans
          </span>
          <button class="page-btn" [disabled]="page() === 1" (click)="changePage(page()-1)">‹ Prev</button>
          @for (p of getPages(); track p) {
            <button class="page-btn" [class.active]="p === page()" (click)="changePage(p)">{{ p }}</button>
          }
          <button class="page-btn" [disabled]="page() >= totalPages" (click)="changePage(page()+1)">Next ›</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .status-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tab {
      padding: 7px 16px; border-radius: 20px; border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: 13px; font-weight: 500;
      transition: all .15s; color: var(--text-secondary);
    }
    .tab:hover { border-color: var(--navy-400); color: var(--navy-900); }
    .tab.active { background: var(--navy-900); color: #fff; border-color: var(--navy-900); }
    .tab.overdue.active { background: var(--danger); border-color: var(--danger); }
  `]
})
export class LoansListComponent implements OnInit {
  private svc = inject(LoanService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  loans = signal<Loan[]>([]);
  totalCount = signal(0);
  page = signal(1);
  pageSize = 15;
  search = '';
  statusFilter = '';

  get totalPages() { return Math.ceil(this.totalCount() / this.pageSize); }
  getPages() {
    const t = this.totalPages;
    const p = this.page();
    const range: number[] = [];
    for (let i = Math.max(1, p-2); i <= Math.min(t, p+2); i++) range.push(i);
    return range;
  }

  ngOnInit() {
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status) this.statusFilter = status;
    this.loadLoans();
  }

  loadLoans() {
    this.loading.set(true);
    const req: any = { page: this.page(), pageSize: this.pageSize };
    if (this.search) req.searchTerm = this.search;
    if (this.statusFilter !== '') req.status = +this.statusFilter;

    this.svc.filter(req).subscribe({
      next: res => {
        this.loans.set(res.items || res);
        this.totalCount.set(res.totalCount || (res.items || res).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setStatus(s: string) {
    this.statusFilter = s;
    this.page.set(1);
    this.loadLoans();
  }

  onSearch() { this.page.set(1); this.loadLoans(); }

  clearFilters() {
    this.search = '';
    this.statusFilter = '';
    this.page.set(1);
    this.loadLoans();
  }

  changePage(p: number) { this.page.set(p); this.loadLoans(); }
}
