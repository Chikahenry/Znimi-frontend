import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../core/services/api.services';
import { NairaPipe } from '../../shared/pipes/naira.pipe';
import { DashboardSummary, PortfolioHealth } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NairaPipe],
  template: `
    <div class="page-header flex-between">
      <div>
        <h2>Dashboard</h2>
        <div class="breadcrumb">Overview of your loan portfolio</div>
      </div>
      <div class="flex gap-2">
        <a routerLink="/loans/new" class="btn btn-gold">+ New Loan</a>
        <a routerLink="/borrowers/new" class="btn btn-outline">+ New Borrower</a>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div><span>Loading dashboard...</span></div>
    } @else {
      <!-- KPI Grid -->
      <div class="stat-grid mb-4">
        <div class="stat-card">
          <div class="stat-icon">💼</div>
          <div class="stat-label">Total Outstanding</div>
          <div class="stat-value money">{{ summary()?.totalLoansOutstanding | naira }}</div>
          <div class="stat-sub">Principal disbursed & unpaid</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-label">Active Loans</div>
          <div class="stat-value">{{ summary()?.activeLoansCount | number }}</div>
          <div class="stat-sub">Currently being repaid</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💵</div>
          <div class="stat-label">Interest Income (MTD)</div>
          <div class="stat-value money">{{ summary()?.interestIncomeMonthToDate | naira }}</div>
          <div class="stat-sub">This calendar month</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚠</div>
          <div class="stat-label">Overdue Loans</div>
          <div class="stat-value" [class.text-danger]="(summary()?.overdueLoansCount || 0) > 0">
            {{ summary()?.overdueLoansCount }}
          </div>
          <div class="stat-sub">Require immediate follow-up</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-label">Collection Rate</div>
          <div class="stat-value" [class.text-success]="(summary()?.collectionRate || 0) >= 90">
            {{ summary()?.collectionRate?.toFixed(1) }}%
          </div>
          <div class="stat-sub">Payments collected on time</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-label">Disbursed This Month</div>
          <div class="stat-value money">{{ summary()?.totalPrincipalDisbursedThisMonth | naira }}</div>
          <div class="stat-sub">New principal issued</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📏</div>
          <div class="stat-label">Avg Loan Size</div>
          <div class="stat-value money">{{ summary()?.averageLoanSize | naira }}</div>
          <div class="stat-sub">Across active loans</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔔</div>
          <div class="stat-label">Penalties Collected</div>
          <div class="stat-value money">{{ summary()?.penaltiesCollected | naira }}</div>
          <div class="stat-sub">Late payment charges</div>
        </div>
      </div>

      <!-- Portfolio Health + Quick Links -->
      <div class="grid-2">
        <!-- Portfolio Health -->
        <div class="card">
          <div class="card-header">
            <h4>Portfolio Health</h4>
            <a routerLink="/reports" class="btn btn-outline btn-sm">Full Report →</a>
          </div>
          <div class="card-body">
            @if (health()) {
              <div style="display:flex;flex-direction:column;gap:14px">
                @for (item of getHealthItems(); track item.label) {
                  <div>
                    <div class="flex-between mb-1" style="font-size:12px">
                      <span style="color:var(--text-secondary)">{{ item.label }}</span>
                      <span style="font-weight:600">{{ item.value.toFixed(1) }}%</span>
                    </div>
                    <div class="progress-bar-wrap">
                      <div class="progress-bar" [class]="item.color" [style.width.%]="item.value"></div>
                    </div>
                  </div>
                }
              </div>
              <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
                <div>
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">PAR 30</div>
                  <div style="font-weight:700;color:var(--warning)">{{ health()?.par30?.toFixed(1) }}%</div>
                </div>
                <div>
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">PAR 60</div>
                  <div style="font-weight:700;color:var(--danger)">{{ health()?.par60?.toFixed(1) }}%</div>
                </div>
                <div>
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">PAR 90</div>
                  <div style="font-weight:700;color:#7c3aed">{{ health()?.par90?.toFixed(1) }}%</div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header"><h4>Quick Actions</h4></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
            <a routerLink="/loans/new" class="quick-action">
              <span class="qa-icon">📋</span>
              <div>
                <div class="qa-label">New Loan Application</div>
                <div class="qa-sub">Submit a loan request for a borrower</div>
              </div>
              <span style="margin-left:auto;color:var(--text-muted)">→</span>
            </a>
            <a routerLink="/payments/record" class="quick-action">
              <span class="qa-icon">💳</span>
              <div>
                <div class="qa-label">Record Payment</div>
                <div class="qa-sub">Log a repayment or penalty collection</div>
              </div>
              <span style="margin-left:auto;color:var(--text-muted)">→</span>
            </a>
            <a routerLink="/borrowers/new" class="quick-action">
              <span class="qa-icon">👤</span>
              <div>
                <div class="qa-label">Register Borrower</div>
                <div class="qa-sub">Add a new borrower profile</div>
              </div>
              <span style="margin-left:auto;color:var(--text-muted)">→</span>
            </a>
            <a routerLink="/loans/calculator" class="quick-action">
              <span class="qa-icon">🧮</span>
              <div>
                <div class="qa-label">Loan Calculator</div>
                <div class="qa-sub">Calculate repayment schedules</div>
              </div>
              <span style="margin-left:auto;color:var(--text-muted)">→</span>
            </a>
            <a routerLink="/reports" class="quick-action">
              <span class="qa-icon">📈</span>
              <div>
                <div class="qa-label">Generate Report</div>
                <div class="qa-sub">Revenue, cash flow, and collections</div>
              </div>
              <span style="margin-left:auto;color:var(--text-muted)">→</span>
            </a>
            <a routerLink="/loans?status=6" class="quick-action" style="border-color:#fecaca;background:#fff5f5">
              <span class="qa-icon">⚠️</span>
              <div>
                <div class="qa-label" style="color:var(--danger)">View Overdue Loans</div>
                <div class="qa-sub">{{ summary()?.overdueLoansCount }} loans need attention</div>
              </div>
              <span style="margin-left:auto;color:var(--text-muted)">→</span>
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .quick-action {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all .15s;
      text-decoration: none;
      color: var(--text-primary);
    }
    .quick-action:hover { border-color: var(--navy-400); background: var(--surface-2); }
    .qa-icon { font-size: 20px; width: 32px; text-align: center; }
    .qa-label { font-size: 13px; font-weight: 600; }
    .qa-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  `]
})
export class DashboardComponent implements OnInit {
  private analytics = inject(AnalyticsService);
  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  health = signal<PortfolioHealth | null>(null);

  ngOnInit() {
    Promise.all([
      this.analytics.getDashboard().toPromise(),
      this.analytics.getPortfolioHealth().toPromise()
    ]).then(([summary, health]) => {
      this.summary.set(summary as DashboardSummary);
      this.health.set(health as PortfolioHealth);
      this.loading.set(false);
    }).catch(() => this.loading.set(false));
  }

  getHealthItems() {
    const h = this.health();
    if (!h) return [];
    return [
      { label: 'On-Time', value: h.percentOnTime, color: 'green' },
      { label: 'Due Soon', value: h.percentDue, color: '' },
      { label: 'Overdue', value: h.percentOverdue, color: 'red' },
      { label: 'At Risk', value: h.percentAtRisk, color: 'red' },
      { label: 'Defaulted', value: h.percentDefaulted, color: 'red' },
    ];
  }
}
