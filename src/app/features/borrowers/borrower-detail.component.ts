import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BorrowerService } from '../../core/services/api.services';
import { Borrower, Loan, CreditScore, LoanStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { NairaPipe } from '../../shared/pipes/naira.pipe';

@Component({
  selector: 'app-borrower-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, NairaPipe],
  template: `
    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else if (borrower()) {
      <div class="page-header flex-between">
        <div>
          <h2>{{ borrower()!.fullName }}</h2>
          <div class="breadcrumb">
            <a routerLink="/borrowers" style="color:var(--navy-600)">Borrowers</a> / Detail
          </div>
        </div>
        <div class="flex gap-2">
          <a [routerLink]="['/borrowers', borrower()!.borrowerId, 'edit']" class="btn btn-outline">Edit</a>
          <a [routerLink]="['/loans/new']" [queryParams]="{borrowerId: borrower()!.borrowerId}" class="btn btn-gold">+ New Loan</a>
        </div>
      </div>

      <div class="grid-2">
        <!-- Profile Card -->
        <div class="card">
          <div class="card-header"><h4>Borrower Profile</h4></div>
          <div class="card-body">
            <div class="profile-grid">
              <div class="profile-row">
                <span class="label">Full Name</span>
                <span>{{ borrower()!.fullName }}</span>
              </div>
              <div class="profile-row">
                <span class="label">Phone</span>
                <span>{{ borrower()!.phoneNumber }}</span>
              </div>
              @if (borrower()!.alternatePhoneNumber) {
                <div class="profile-row">
                  <span class="label">Alt. Phone</span>
                  <span>{{ borrower()!.alternatePhoneNumber }}</span>
                </div>
              }
              @if (borrower()!.email) {
                <div class="profile-row">
                  <span class="label">Email</span>
                  <span>{{ borrower()!.email }}</span>
                </div>
              }
              <div class="profile-row">
                <span class="label">NIN</span>
                <code>{{ borrower()!.nationalIdNumber }}</code>
              </div>
              @if (borrower()!.homeAddress) {
                <div class="profile-row">
                  <span class="label">Address</span>
                  <span>{{ borrower()!.homeAddress }}</span>
                </div>
              }
              @if (borrower()!.employerOrBusiness) {
                <div class="profile-row">
                  <span class="label">Employer</span>
                  <span>{{ borrower()!.employerOrBusiness }}</span>
                </div>
              }
              @if (borrower()!.guarantorName) {
                <div class="profile-row">
                  <span class="label">Guarantor</span>
                  <span>{{ borrower()!.guarantorName }} ({{ borrower()!.guarantorPhone }})</span>
                </div>
              }
              <div class="profile-row">
                <span class="label">Registered</span>
                <span>{{ borrower()!.createdAt | date:'dd MMM yyyy' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="stat-grid" style="grid-template-columns:1fr 1fr">
            <div class="stat-card">
              <div class="stat-label">Credit Score</div>
              <div class="stat-value">{{ CreditScore[borrower()!.internalCreditScore] }}</div>
              <div class="stat-sub">Internal rating</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">On-Time Rate</div>
              <div class="stat-value" [class.text-success]="borrower()!.onTimePaymentPercentage >= 90">
                {{ borrower()!.onTimePaymentPercentage?.toFixed(0) }}%
              </div>
              <div class="stat-sub">Payment history</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Loans</div>
              <div class="stat-value">{{ borrower()!.totalLoansCount }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Defaults</div>
              <div class="stat-value" [class.text-danger]="borrower()!.defaultedLoansCount > 0">
                {{ borrower()!.defaultedLoansCount }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loan History -->
      <div class="card mt-4">
        <div class="card-header">
          <h4>Loan History</h4>
          <a [routerLink]="['/loans/new']" [queryParams]="{borrowerId: borrower()!.borrowerId}" class="btn btn-gold btn-sm">+ New Loan</a>
        </div>
        @if (loans().length === 0) {
          <div class="empty-state">
            <div class="icon">📋</div>
            <h4>No loans yet</h4>
            <p>This borrower has no loan history</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Loan #</th>
                  <th>Amount</th>
                  <th>Outstanding</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (loan of loans(); track loan.loanId) {
                  <tr>
                    <td><code>{{ loan.loanNumber }}</code></td>
                    <td class="money">{{ loan.approvedAmount | naira }}</td>
                    <td class="money">{{ loan.outstandingPrincipal | naira }}</td>
                    <td>{{ loan.durationInMonths }}m</td>
                    <td><app-status-badge [status]="loan.status" /></td>
                    <td>{{ loan.applicationDate | date:'dd MMM yyyy' }}</td>
                    <td><a [routerLink]="['/loans', loan.loanId]" class="btn btn-outline btn-sm">View</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .profile-grid { display: flex; flex-direction: column; gap: 12px; }
    .profile-row { display: flex; gap: 12px; font-size: 13px; }
    .profile-row .label { font-weight: 600; color: var(--text-muted); min-width: 110px; font-size: 12px; padding-top: 1px; }
  `]
})
export class BorrowerDetailComponent implements OnInit {
  private svc = inject(BorrowerService);
  private route = inject(ActivatedRoute);
  CreditScore = CreditScore;

  loading = signal(true);
  borrower = signal<Borrower | null>(null);
  loans = signal<Loan[]>([]);

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    Promise.all([
      this.svc.getById(id).toPromise(),
      this.svc.getLoanHistory(id).toPromise()
    ]).then(([b, loans]) => {
      this.borrower.set(b as Borrower);
      this.loans.set(loans as Loan[] || []);
      this.loading.set(false);
    }).catch(() => this.loading.set(false));
  }
}
