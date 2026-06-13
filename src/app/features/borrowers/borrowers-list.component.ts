import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BorrowerService } from '../../core/services/api.services';
import { Borrower, CreditScore } from '../../core/models/models';

@Component({
  selector: 'app-borrowers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header flex-between">
      <div>
        <h2>Borrowers</h2>
        <div class="breadcrumb">Manage all borrower profiles</div>
      </div>
      <a routerLink="/borrowers/new" class="btn btn-gold">+ Add Borrower</a>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body" style="display:grid;grid-template-columns:1fr 150px 150px auto;gap:12px;align-items:end">
        <div class="form-group" style="margin:0">
          <label class="form-label">Search</label>
          <input class="form-control" [(ngModel)]="search" placeholder="Name, phone, NIN..." (input)="onSearch()">
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Credit Score</label>
          <select class="form-control" [(ngModel)]="creditFilter" (change)="loadBorrowers()">
            <option value="">All</option>
            <option value="0">A (Excellent)</option>
            <option value="1">B (Good)</option>
            <option value="2">C (Fair)</option>
            <option value="3">D (Poor)</option>
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Status</label>
          <select class="form-control" [(ngModel)]="activeFilter" (change)="loadBorrowers()">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button class="btn btn-outline" (click)="clearFilters()">Clear</button>
      </div>
    </div>

    <div class="card">
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      } @else if (borrowers().length === 0) {
        <div class="empty-state">
          <div class="icon">👥</div>
          <h4>No borrowers found</h4>
          <p>Add your first borrower to get started</p>
          <a routerLink="/borrowers/new" class="btn btn-gold mt-3">+ Add Borrower</a>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>NIN</th>
                <th>Credit Score</th>
                <th>Loans</th>
                <th>On-Time %</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (b of borrowers(); track b.borrowerId) {
                <tr>
                  <td>
                    <a [routerLink]="['/borrowers', b.borrowerId]" style="font-weight:600;color:var(--navy-600);text-decoration:none">
                      {{ b.fullName }}
                    </a>
                    @if (b.email) {
                      <div style="font-size:11px;color:var(--text-muted)">{{ b.email }}</div>
                    }
                  </td>
                  <td>{{ b.phoneNumber }}</td>
                  <td><code style="font-size:11px">{{ b.nationalIdNumber }}</code></td>
                  <td>
                    <span class="credit-badge" [class]="'credit-' + CreditScore[b.internalCreditScore]?.toLowerCase()">
                      {{ CreditScore[b.internalCreditScore] }}
                    </span>
                  </td>
                  <td>{{ b.totalLoansCount }}</td>
                  <td>
                    <span [class.text-success]="b.onTimePaymentPercentage >= 90"
                          [class.text-warning]="b.onTimePaymentPercentage >= 70 && b.onTimePaymentPercentage < 90"
                          [class.text-danger]="b.onTimePaymentPercentage < 70">
                      {{ b.onTimePaymentPercentage?.toFixed(0) }}%
                    </span>
                  </td>
                  <td>
                    <span [class]="b.isActive ? 'badge badge-active' : 'badge badge-closed'">
                      {{ b.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <a [routerLink]="['/borrowers', b.borrowerId]" class="btn btn-outline btn-sm">View</a>
                      <a [routerLink]="['/borrowers', b.borrowerId, 'edit']" class="btn btn-outline btn-sm">Edit</a>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div class="pagination">
          <span style="color:var(--text-muted);font-size:12px;margin-right:auto">
            Showing {{ borrowers().length }} of {{ totalCount() }} borrowers
          </span>
          <button class="page-btn" [disabled]="page() === 1" (click)="changePage(page() - 1)">‹ Prev</button>
          @for (p of pages(); track p) {
            <button class="page-btn" [class.active]="p === page()" (click)="changePage(p)">{{ p }}</button>
          }
          <button class="page-btn" [disabled]="page() >= totalPages()" (click)="changePage(page() + 1)">Next ›</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .credit-badge { display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700; }
    .credit-a { background:#d1fae5;color:#065f46; }
    .credit-b { background:#dbeafe;color:#1e40af; }
    .credit-c { background:#fef3c7;color:#78350f; }
    .credit-d { background:#fee2e2;color:#991b1b; }
    .badge { display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase; }
    .badge-active { background:#d1fae5;color:#065f46; }
    .badge-closed { background:#f3f4f6;color:#6b7280; }
  `]
})
export class BorrowersListComponent implements OnInit {
  private svc = inject(BorrowerService);
  CreditScore = CreditScore;

  loading = signal(true);
  borrowers = signal<Borrower[]>([]);
  totalCount = signal(0);
  page = signal(1);
  pageSize = 15;

  search = '';
  creditFilter = '';
  activeFilter = '';

  get totalPages() { return signal(Math.ceil(this.totalCount() / this.pageSize)); }
  get pages() {
    const t = Math.ceil(this.totalCount() / this.pageSize);
    const p = this.page();
    const range: number[] = [];
    for (let i = Math.max(1, p-2); i <= Math.min(t, p+2); i++) range.push(i);
    return signal(range);
  }

  ngOnInit() { this.loadBorrowers(); }

  loadBorrowers() {
    this.loading.set(true);
    const req: any = { page: this.page(), pageSize: this.pageSize };
    if (this.search) req.searchTerm = this.search;
    if (this.creditFilter !== '') req.creditScore = +this.creditFilter;
    if (this.activeFilter !== '') req.isActive = this.activeFilter === 'true';

    this.svc.filter(req).subscribe({
      next: (res) => {
        this.borrowers.set(res.items || res);
        this.totalCount.set(res.totalCount || (res.items || res).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    this.page.set(1);
    this.loadBorrowers();
  }

  clearFilters() {
    this.search = '';
    this.creditFilter = '';
    this.activeFilter = '';
    this.page.set(1);
    this.loadBorrowers();
  }

  changePage(p: number) {
    this.page.set(p);
    this.loadBorrowers();
  }
}
