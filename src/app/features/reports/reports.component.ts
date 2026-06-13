import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../core/services/api.services';
import { NairaPipe } from '../../shared/pipes/naira.pipe';

type ReportTab = 'dashboard' | 'cashflow' | 'revenue' | 'recollection' | 'portfolio';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NairaPipe],
  template: `
    <div class="page-header flex-between">
      <div>
        <h2>Reports & Analytics</h2>
        <div class="breadcrumb">Portfolio analysis, revenue, cash flow, and recollection</div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-outline export-btn" (click)="exportPDF()" [disabled]="exporting()">
          <span *ngIf="!exporting()">📄 Export PDF</span>
          <span *ngIf="exporting()"><span class="spinner" style="width:13px;height:13px;border-width:2px;"></span> Exporting…</span>
        </button>
        <button class="btn btn-outline export-btn" (click)="exportExcel()" [disabled]="exporting()">📊 Export Excel</button>
        <button class="btn btn-outline" (click)="printPage()">🖨 Print</button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="report-tabs mb-4">
      <button class="rtab" [class.active]="activeTab() === 'dashboard'" (click)="setTab('dashboard')">📊 Portfolio Overview</button>
      <button class="rtab" [class.active]="activeTab() === 'revenue'" (click)="setTab('revenue')">💵 Revenue Report</button>
      <button class="rtab" [class.active]="activeTab() === 'cashflow'" (click)="setTab('cashflow')">💧 Cash Flow Projection</button>
      <button class="rtab" [class.active]="activeTab() === 'recollection'" (click)="setTab('recollection')">🔔 Recollection</button>
      <button class="rtab" [class.active]="activeTab() === 'portfolio'" (click)="setTab('portfolio')">🏥 Portfolio Health</button>
    </div>

    <!-- PORTFOLIO OVERVIEW -->
    @if (activeTab() === 'dashboard') {
      @if (loading()) { <div class="loading-overlay"><div class="spinner"></div></div> }
      @else if (summary()) {
        <div class="stat-grid mb-4">
          <div class="stat-card"><div class="stat-label">Total Outstanding</div><div class="stat-value money">{{ summary()!.totalLoansOutstanding | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Active Loans</div><div class="stat-value">{{ summary()!.activeLoansCount }}</div></div>
          <div class="stat-card"><div class="stat-label">Overdue Loans</div><div class="stat-value text-danger">{{ summary()!.overdueLoansCount }}</div></div>
          <div class="stat-card">
            <div class="stat-label">Collection Rate</div>
            <div class="stat-value" [class.text-success]="(summary()!.collectionRate || 0) >= 90">{{ summary()!.collectionRate?.toFixed(1) }}%</div>
          </div>
          <div class="stat-card"><div class="stat-label">Interest Income (MTD)</div><div class="stat-value money">{{ summary()!.interestIncomeMonthToDate | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Penalties Collected</div><div class="stat-value money">{{ summary()!.penaltiesCollected | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Principal Disbursed (MTD)</div><div class="stat-value money">{{ summary()!.totalPrincipalDisbursedThisMonth | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Avg Loan Size</div><div class="stat-value money">{{ summary()!.averageLoanSize | naira }}</div></div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>🏆 Top Performing Borrowers</h4></div>
            @if (topBorrowers().length === 0) { <div class="empty-state" style="padding:24px"><p>No data</p></div> }
            @else {
              <div class="table-wrap">
                <table class="data-table">
                  <thead><tr><th>Borrower</th><th>On-Time %</th><th>Loans</th></tr></thead>
                  <tbody>
                    @for (b of topBorrowers(); track b.borrowerId) {
                      <tr>
                        <td><a [routerLink]="['/borrowers', b.borrowerId]" style="color:var(--navy-600);text-decoration:none;font-weight:500">{{ b.fullName }}</a></td>
                        <td class="text-success" style="font-weight:600">{{ b.onTimePaymentPercentage?.toFixed(0) }}%</td>
                        <td>{{ b.totalLoansCount }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
          <div class="card">
            <div class="card-header"><h4>⚠️ High Risk Borrowers</h4></div>
            @if (riskBorrowers().length === 0) { <div class="empty-state" style="padding:24px"><p>No high-risk borrowers</p></div> }
            @else {
              <div class="table-wrap">
                <table class="data-table">
                  <thead><tr><th>Borrower</th><th>On-Time %</th><th>Defaults</th></tr></thead>
                  <tbody>
                    @for (b of riskBorrowers(); track b.borrowerId) {
                      <tr>
                        <td><a [routerLink]="['/borrowers', b.borrowerId]" style="color:var(--danger);text-decoration:none;font-weight:500">{{ b.fullName }}</a></td>
                        <td class="text-danger" style="font-weight:600">{{ b.onTimePaymentPercentage?.toFixed(0) }}%</td>
                        <td class="text-danger">{{ b.defaultedLoansCount }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }
    }

    <!-- REVENUE REPORT -->
    @if (activeTab() === 'revenue') {
      <div class="card mb-4">
        <div class="card-header"><h4>Revenue Report Parameters</h4></div>
        <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end">
          <div class="form-group" style="margin:0"><label class="form-label">From Date</label><input type="date" class="form-control" [(ngModel)]="revenueFrom"></div>
          <div class="form-group" style="margin:0"><label class="form-label">To Date</label><input type="date" class="form-control" [(ngModel)]="revenueTo"></div>
          <button class="btn btn-gold" (click)="loadRevenue()">Generate Report</button>
        </div>
      </div>
      @if (revenueLoading()) { <div class="loading-overlay"><div class="spinner"></div></div> }
      @else if (revenue()) {
        <div class="stat-grid mb-4">
          <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value money text-success">{{ revenue()!.totalRevenue | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Interest Income</div><div class="stat-value money">{{ revenue()!.totalInterestIncome | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Penalty Income</div><div class="stat-value money">{{ revenue()!.totalPenaltyIncome | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Disbursed</div><div class="stat-value money">{{ revenue()!.totalDisbursed | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Collected</div><div class="stat-value money">{{ revenue()!.totalCollected | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Loans Issued</div><div class="stat-value">{{ revenue()!.loansIssued }}</div></div>
        </div>
        @if (revenue()!.monthlyBreakdown?.length > 0) {
          <div class="card">
            <div class="card-header"><h4>Monthly Breakdown</h4></div>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Month</th><th>Interest</th><th>Penalties</th><th>Total Revenue</th><th>Disbursed</th><th>Collected</th></tr></thead>
                <tbody>
                  @for (m of revenue()!.monthlyBreakdown; track m.month) {
                    <tr>
                      <td>{{ m.month }}</td>
                      <td class="money">{{ m.interestIncome | naira }}</td>
                      <td class="money">{{ m.penaltyIncome | naira }}</td>
                      <td class="money" style="font-weight:600">{{ (m.interestIncome + m.penaltyIncome) | naira }}</td>
                      <td class="money">{{ m.disbursed | naira }}</td>
                      <td class="money text-success">{{ m.collected | naira }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      } @else {
        <div class="card"><div class="card-body empty-state"><div class="icon">💵</div><h4>Select a date range</h4><p>Choose start and end dates to generate the revenue report</p></div></div>
      }
    }

    <!-- CASH FLOW PROJECTION -->
    @if (activeTab() === 'cashflow') {
      <div class="card mb-4">
        <div class="card-header"><h4>Cash Flow Projection</h4></div>
        <div class="card-body" style="display:flex;gap:12px;align-items:flex-end">
          <div class="form-group" style="margin:0;min-width:150px">
            <label class="form-label">Projection Days</label>
            <select class="form-control" [(ngModel)]="cashFlowDays" (change)="loadCashFlow()">
              <option value="7">7 days</option><option value="14">14 days</option>
              <option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option>
            </select>
          </div>
        </div>
      </div>
      @if (cashFlowLoading()) { <div class="loading-overlay"><div class="spinner"></div></div> }
      @else {
        <div class="stat-grid mb-4" style="grid-template-columns:repeat(3,1fr)">
          <div class="stat-card"><div class="stat-label">Expected Principal</div><div class="stat-value money">{{ getCashFlowTotals().principal | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Expected Interest</div><div class="stat-value money text-warning">{{ getCashFlowTotals().interest | naira }}</div></div>
          <div class="stat-card"><div class="stat-label">Expected Total</div><div class="stat-value money text-success">{{ getCashFlowTotals().total | naira }}</div></div>
        </div>
        <div class="card">
          <div class="card-header"><h4>Daily Cash Flow — Next {{ cashFlowDays }} Days</h4></div>
          @if (cashFlow().length === 0) { <div class="empty-state" style="padding:32px"><p>No upcoming cash flows found</p></div> }
          @else {
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Date</th><th>Expected Principal</th><th>Expected Interest</th><th>Total Expected</th><th>Bar</th></tr></thead>
                <tbody>
                  @for (cf of cashFlow(); track cf.date) {
                    <tr>
                      <td style="font-weight:500">{{ cf.date | date:'EEE dd MMM' }}</td>
                      <td class="money">{{ cf.expectedPrincipal | naira }}</td>
                      <td class="money text-warning">{{ cf.expectedInterest | naira }}</td>
                      <td class="money" style="font-weight:700">{{ cf.expectedTotal | naira }}</td>
                      <td style="min-width:120px"><div class="progress-bar-wrap"><div class="progress-bar green" [style.width.%]="getBarWidth(cf.expectedTotal)"></div></div></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    }

    <!-- RECOLLECTION -->
    @if (activeTab() === 'recollection') {
      <div class="card mb-4">
        <div class="card-body">
          <h4 style="margin-bottom:12px">📋 Recollection Strategy</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">
            <div class="recoll-stat"><div class="rcs-dot" style="background:var(--warning)"></div><div><div style="font-weight:600;font-size:13px">Due Soon</div><div style="font-size:12px;color:var(--text-muted)">Send reminders 3 days before due date</div></div></div>
            <div class="recoll-stat"><div class="rcs-dot" style="background:var(--danger)"></div><div><div style="font-weight:600;font-size:13px">Overdue</div><div style="font-size:12px;color:var(--text-muted)">Immediate contact, apply penalty</div></div></div>
            <div class="recoll-stat"><div class="rcs-dot" style="background:#7c3aed"></div><div><div style="font-weight:600;font-size:13px">Defaulted</div><div style="font-size:12px;color:var(--text-muted)">Escalate to legal, guarantor contact</div></div></div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
            <a routerLink="/loans" [queryParams]="{status: 5}" class="recoll-action"><span>📅</span><div><div style="font-weight:600">Due Loans</div><div style="font-size:11px;color:var(--text-muted)">Loans due this period</div></div><span class="ra-badge warning">Due</span></a>
            <a routerLink="/loans" [queryParams]="{status: 6}" class="recoll-action"><span>⚠️</span><div><div style="font-weight:600">Overdue Loans</div><div style="font-size:11px;color:var(--text-muted)">Past due date</div></div><span class="ra-badge danger">Overdue</span></a>
            <a routerLink="/loans" [queryParams]="{status: 8}" class="recoll-action"><span>🚨</span><div><div style="font-weight:600">At-Risk Loans</div><div style="font-size:11px;color:var(--text-muted)">High probability of default</div></div><span class="ra-badge purple">At Risk</span></a>
            <a routerLink="/loans" [queryParams]="{status: 9}" class="recoll-action"><span>💀</span><div><div style="font-weight:600">Defaulted Loans</div><div style="font-size:11px;color:var(--text-muted)">Require escalated recovery</div></div><span class="ra-badge dark">Default</span></a>
          </div>
        </div>
      </div>
      @if (recollLoading()) { <div class="loading-overlay"><div class="spinner"></div></div> }
      @else if (riskBorrowers().length > 0) {
        <div class="card">
          <div class="card-header"><h4>High-Risk Borrowers — Priority Collection List</h4></div>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Borrower</th><th>Phone</th><th>On-Time %</th><th>Missed Payments</th><th>Defaults</th><th>Action</th></tr></thead>
              <tbody>
                @for (b of riskBorrowers(); track b.borrowerId) {
                  <tr>
                    <td style="font-weight:500">{{ b.fullName }}</td>
                    <td>{{ b.phoneNumber || '—' }}</td>
                    <td class="text-danger" style="font-weight:600">{{ b.onTimePaymentPercentage?.toFixed(0) }}%</td>
                    <td class="text-danger">{{ b.missedPaymentsCount }}</td>
                    <td class="text-danger">{{ b.defaultedLoansCount }}</td>
                    <td><a [routerLink]="['/borrowers', b.borrowerId]" class="btn btn-outline btn-sm">View</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }

    <!-- PORTFOLIO HEALTH -->
    @if (activeTab() === 'portfolio') {
      @if (!health()) { <div class="loading-overlay"><div class="spinner"></div></div> }
      @else {
        <div class="stat-grid mb-4">
          <div class="stat-card"><div class="stat-label">On-Time Rate</div><div class="stat-value text-success">{{ health()!.percentOnTime?.toFixed(1) }}%</div></div>
          <div class="stat-card"><div class="stat-label">Due Soon</div><div class="stat-value text-warning">{{ health()!.percentDue?.toFixed(1) }}%</div></div>
          <div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-value text-danger">{{ health()!.percentOverdue?.toFixed(1) }}%</div></div>
          <div class="stat-card"><div class="stat-label">Defaulted</div><div class="stat-value text-danger">{{ health()!.percentDefaulted?.toFixed(1) }}%</div></div>
        </div>
        <div class="card">
          <div class="card-header"><h4>Portfolio at Risk (PAR) Metrics</h4></div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:center">
              <div class="par-box" style="border-color:var(--warning)"><div class="par-label">PAR 30</div><div class="par-value" style="color:var(--warning)">{{ health()!.par30?.toFixed(2) }}%</div><div class="par-desc">Loans 30+ days overdue</div></div>
              <div class="par-box" style="border-color:var(--danger)"><div class="par-label">PAR 60</div><div class="par-value" style="color:var(--danger)">{{ health()!.par60?.toFixed(2) }}%</div><div class="par-desc">Loans 60+ days overdue</div></div>
              <div class="par-box" style="border-color:#7c3aed"><div class="par-label">PAR 90</div><div class="par-value" style="color:#7c3aed">{{ health()!.par90?.toFixed(2) }}%</div><div class="par-desc">Loans 90+ days overdue</div></div>
            </div>
            <div style="margin-top:24px">
              <h4 style="margin-bottom:16px">Distribution Breakdown</h4>
              @for (item of getHealthItems(); track item.label) {
                <div style="margin-bottom:12px">
                  <div class="flex-between mb-1" style="font-size:12px">
                    <span style="color:var(--text-secondary)">{{ item.label }}</span>
                    <span style="font-weight:600">{{ item.value?.toFixed(1) }}%</span>
                  </div>
                  <div class="progress-bar-wrap"><div class="progress-bar" [class]="item.color" [style.width.%]="item.value"></div></div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .export-btn { min-width: 130px; }
    .report-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .rtab { padding: 9px 18px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: 13px; font-weight: 500; transition: all .15s; color: var(--text-secondary); }
    .rtab:hover { border-color: var(--navy-400); color: var(--navy-900); }
    .rtab.active { background: var(--navy-900); color: #fff; border-color: var(--navy-900); }
    .recoll-stat { display: flex; align-items: flex-start; gap: 12px; }
    .rcs-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
    .recoll-action { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; text-decoration: none; color: var(--text-primary); font-size: 13px; transition: all .15s; }
    .recoll-action:hover { background: var(--surface-2); }
    .ra-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
    .ra-badge.warning { background: #fef3c7; color: #78350f; }
    .ra-badge.danger  { background: #fee2e2; color: #991b1b; }
    .ra-badge.purple  { background: #ede9fe; color: #5b21b6; }
    .ra-badge.dark    { background: #1f1f1f; color: #fca5a5; }
    .par-box { border: 2px solid; border-radius: 8px; padding: 20px; }
    .par-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted); margin-bottom: 8px; }
    .par-value { font-size: 2rem; font-weight: 700; margin-bottom: 6px; }
    .par-desc { font-size: 11px; color: var(--text-muted); }
  `]
})
export class ReportsComponent implements OnInit {
  private analytics = inject(AnalyticsService);

  activeTab = signal<ReportTab>('dashboard');
  loading = signal(true);
  revenueLoading = signal(false);
  cashFlowLoading = signal(false);
  recollLoading = signal(false);
  exporting = signal(false);

  summary = signal<any>(null);
  health = signal<any>(null);
  revenue = signal<any>(null);
  cashFlow = signal<any[]>([]);
  topBorrowers = signal<any[]>([]);
  riskBorrowers = signal<any[]>([]);

  revenueFrom = this.getDateStr(-30);
  revenueTo = this.getDateStr(0);
  cashFlowDays = '30';
  maxCashFlowAmount = 0;

  ngOnInit() { this.loadDashboardData(); }

  setTab(tab: ReportTab) {
    this.activeTab.set(tab);
    if (tab === 'cashflow' && this.cashFlow().length === 0) this.loadCashFlow();
    if (tab === 'recollection' && this.riskBorrowers().length === 0) this.loadRiskBorrowers();
    if (tab === 'portfolio' && !this.health()) this.loadHealth();
  }

  loadDashboardData() {
    this.loading.set(true);
    Promise.all([
      this.analytics.getDashboard().toPromise(),
      this.analytics.getTopBorrowers(10).toPromise(),
    ]).then(([summary, top]) => {
      this.summary.set(summary);
      this.topBorrowers.set(top as any[] || []);
      this.loading.set(false);
      this.loadRiskBorrowers();
    }).catch(() => this.loading.set(false));
  }

  loadHealth() { this.analytics.getPortfolioHealth().subscribe(h => this.health.set(h)); }

  loadRiskBorrowers() {
    this.recollLoading.set(true);
    this.analytics.getHighRiskBorrowers(20).subscribe({
      next: b => { this.riskBorrowers.set(b); this.recollLoading.set(false); },
      error: () => this.recollLoading.set(false)
    });
  }

  loadRevenue() {
    if (!this.revenueFrom || !this.revenueTo) return;
    this.revenueLoading.set(true);
    this.analytics.getRevenue(this.revenueFrom, this.revenueTo).subscribe({
      next: r => { this.revenue.set(r); this.revenueLoading.set(false); },
      error: () => this.revenueLoading.set(false)
    });
  }

  loadCashFlow() {
    this.cashFlowLoading.set(true);
    this.analytics.getCashFlow(+this.cashFlowDays).subscribe({
      next: cf => {
        this.cashFlow.set(cf);
        this.maxCashFlowAmount = Math.max(...cf.map((c: any) => c.expectedTotal), 1);
        this.cashFlowLoading.set(false);
      },
      error: () => this.cashFlowLoading.set(false)
    });
  }

  getCashFlowTotals() {
    const cf = this.cashFlow();
    return {
      principal: cf.reduce((s: number, c: any) => s + c.expectedPrincipal, 0),
      interest: cf.reduce((s: number, c: any) => s + c.expectedInterest, 0),
      total: cf.reduce((s: number, c: any) => s + c.expectedTotal, 0)
    };
  }

  getBarWidth(amount: number): number {
    return this.maxCashFlowAmount > 0 ? (amount / this.maxCashFlowAmount) * 100 : 0;
  }

  getHealthItems() {
    const h = this.health();
    if (!h) return [];
    return [
      { label: 'On-Time Payments', value: h.percentOnTime, color: 'green' },
      { label: 'Due Soon', value: h.percentDue, color: '' },
      { label: 'Overdue', value: h.percentOverdue, color: 'red' },
      { label: 'At Risk', value: h.percentAtRisk, color: 'red' },
      { label: 'Defaulted', value: h.percentDefaulted, color: 'red' },
    ];
  }

  getDateStr(offsetDays: number): string {
    const d = new Date(); d.setDate(d.getDate() + offsetDays); return d.toISOString().split('T')[0];
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);
  }

  printPage() { window.print(); }

  // ─── PDF EXPORT ───────────────────────────────────────────────────────────
  async exportPDF() {
    this.exporting.set(true);
    try {
      const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' as any);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const tab = this.activeTab();
      const now = new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
      const pageW = 210; const margin = 14; const col = pageW - margin * 2;

      // Header
      doc.setFillColor(13, 27, 46);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('LOANAPP — Analytics Report', margin, 12);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(`Generated: ${now}`, pageW - margin, 12, { align: 'right' });

      let y = 26;
      const writeTitle = (t: string) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(13, 27, 46);
        doc.text(t, margin, y); y += 2;
        doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.5); doc.line(margin, y, margin + col, y); y += 6;
      };
      const writeStat = (label: string, value: string, isMoney = false) => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text(label, margin + 2, y);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.setTextColor(isMoney ? 15 : 13, isMoney ? 118 : 27, isMoney ? 110 : 46);
        doc.text(value, pageW - margin - 2, y, { align: 'right' }); y += 6;
      };
      const writeTable = (headers: string[], rows: string[][], widths: number[]) => {
        const rowH = 6; const headerH = 7; const xStart = margin;
        // header bg
        doc.setFillColor(13, 27, 46);
        doc.rect(xStart, y, col, headerH, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
        let xc = xStart + 2;
        headers.forEach((h, i) => { doc.text(h, xc, y + 4.5); xc += widths[i]; });
        y += headerH;
        rows.forEach((row, ri) => {
          if (y > 270) { doc.addPage(); y = 20; }
          if (ri % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(xStart, y, col, rowH, 'F'); }
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30);
          xc = xStart + 2;
          row.forEach((cell, i) => { doc.text(String(cell).substring(0, 35), xc, y + 4); xc += widths[i]; });
          y += rowH;
        });
        y += 4;
      };

      if (tab === 'dashboard' && this.summary()) {
        const s = this.summary()!;
        writeTitle('Portfolio Overview');
        writeStat('Total Outstanding', this.fmt(s.totalLoansOutstanding), true);
        writeStat('Active Loans', String(s.activeLoansCount));
        writeStat('Overdue Loans', String(s.overdueLoansCount));
        writeStat('Collection Rate', `${s.collectionRate?.toFixed(1)}%`);
        writeStat('Interest Income (MTD)', this.fmt(s.interestIncomeMonthToDate), true);
        writeStat('Penalties Collected', this.fmt(s.penaltiesCollected), true);
        writeStat('Principal Disbursed (MTD)', this.fmt(s.totalPrincipalDisbursedThisMonth), true);
        writeStat('Average Loan Size', this.fmt(s.averageLoanSize), true);
        y += 4;
        if (this.topBorrowers().length > 0) {
          writeTitle('Top Performing Borrowers');
          writeTable(['Borrower', 'On-Time %', 'Loan Count'], this.topBorrowers().map(b => [b.fullName, `${b.onTimePaymentPercentage?.toFixed(0)}%`, String(b.totalLoansCount)]), [100, 40, 42]);
        }
        if (this.riskBorrowers().length > 0) {
          writeTitle('High-Risk Borrowers');
          writeTable(['Borrower', 'On-Time %', 'Missed', 'Defaults'], this.riskBorrowers().map(b => [b.fullName, `${b.onTimePaymentPercentage?.toFixed(0)}%`, String(b.missedPaymentsCount), String(b.defaultedLoansCount)]), [80, 36, 36, 30]);
        }
      } else if (tab === 'revenue' && this.revenue()) {
        const r = this.revenue()!;
        writeTitle(`Revenue Report — ${this.revenueFrom} to ${this.revenueTo}`);
        writeStat('Total Revenue', this.fmt(r.totalRevenue), true);
        writeStat('Interest Income', this.fmt(r.totalInterestIncome), true);
        writeStat('Penalty Income', this.fmt(r.totalPenaltyIncome), true);
        writeStat('Total Disbursed', this.fmt(r.totalDisbursed), true);
        writeStat('Total Collected', this.fmt(r.totalCollected), true);
        writeStat('Loans Issued', String(r.loansIssued));
        if (r.monthlyBreakdown?.length > 0) {
          y += 4; writeTitle('Monthly Breakdown');
          writeTable(['Month', 'Interest', 'Penalties', 'Total Revenue', 'Disbursed', 'Collected'],
            r.monthlyBreakdown.map((m: any) => [m.month, this.fmt(m.interestIncome), this.fmt(m.penaltyIncome), this.fmt(m.interestIncome + m.penaltyIncome), this.fmt(m.disbursed), this.fmt(m.collected)]),
            [30, 28, 28, 32, 28, 36]);
        }
      } else if (tab === 'cashflow' && this.cashFlow().length > 0) {
        const totals = this.getCashFlowTotals();
        writeTitle(`Cash Flow Projection — Next ${this.cashFlowDays} Days`);
        writeStat('Expected Principal', this.fmt(totals.principal), true);
        writeStat('Expected Interest', this.fmt(totals.interest), true);
        writeStat('Expected Total', this.fmt(totals.total), true);
        y += 4; writeTitle('Daily Breakdown');
        writeTable(['Date', 'Principal', 'Interest', 'Total Expected'],
          this.cashFlow().map((cf: any) => [new Date(cf.date).toLocaleDateString('en-NG'), this.fmt(cf.expectedPrincipal), this.fmt(cf.expectedInterest), this.fmt(cf.expectedTotal)]),
          [40, 44, 44, 54]);
      } else if (tab === 'portfolio' && this.health()) {
        const h = this.health()!;
        writeTitle('Portfolio Health');
        writeStat('On-Time Rate', `${h.percentOnTime?.toFixed(1)}%`);
        writeStat('Due Soon', `${h.percentDue?.toFixed(1)}%`);
        writeStat('Overdue', `${h.percentOverdue?.toFixed(1)}%`);
        writeStat('At Risk', `${h.percentAtRisk?.toFixed(1)}%`);
        writeStat('Defaulted', `${h.percentDefaulted?.toFixed(1)}%`);
        y += 4; writeTitle('PAR Metrics');
        writeStat('PAR 30 (30+ days overdue)', `${h.par30?.toFixed(2)}%`);
        writeStat('PAR 60 (60+ days overdue)', `${h.par60?.toFixed(2)}%`);
        writeStat('PAR 90 (90+ days overdue)', `${h.par90?.toFixed(2)}%`);
      } else if (tab === 'recollection' && this.riskBorrowers().length > 0) {
        writeTitle('Recollection — High Risk Borrowers');
        writeTable(['Borrower', 'Phone', 'On-Time %', 'Missed', 'Defaults'],
          this.riskBorrowers().map(b => [b.fullName, b.phoneNumber || '—', `${b.onTimePaymentPercentage?.toFixed(0)}%`, String(b.missedPaymentsCount), String(b.defaultedLoansCount)]),
          [60, 40, 30, 26, 26]);
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFillColor(13, 27, 46); doc.rect(0, 287, pageW, 10, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('LoanApp — Confidential', margin, 293);
        doc.text(`Page ${i} of ${pages}`, pageW - margin, 293, { align: 'right' });
      }

      doc.save(`LoanApp_Report_${tab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
      alert('PDF export failed. Please try again.');
    } finally {
      this.exporting.set(false);
    }
  }

  // ─── EXCEL EXPORT ─────────────────────────────────────────────────────────
  async exportExcel() {
    this.exporting.set(true);
    try {
      const XLSX = await import('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' as any);
      const tab = this.activeTab();
      const wb = XLSX.utils.book_new();
      const now = new Date().toLocaleDateString('en-NG');

      const addSheet = (name: string, rows: any[][]) => {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, name);
      };

      if (tab === 'dashboard' && this.summary()) {
        const s = this.summary()!;
        addSheet('Portfolio Overview', [
          ['LoanApp Portfolio Overview Report'],
          [`Generated: ${now}`],
          [],
          ['Metric', 'Value'],
          ['Total Outstanding', s.totalLoansOutstanding],
          ['Active Loans', s.activeLoansCount],
          ['Overdue Loans', s.overdueLoansCount],
          ['Collection Rate (%)', s.collectionRate],
          ['Interest Income (MTD)', s.interestIncomeMonthToDate],
          ['Penalties Collected', s.penaltiesCollected],
          ['Principal Disbursed (MTD)', s.totalPrincipalDisbursedThisMonth],
          ['Average Loan Size', s.averageLoanSize],
        ]);
        if (this.topBorrowers().length > 0) {
          addSheet('Top Borrowers', [
            ['Borrower', 'On-Time %', 'Total Loans'],
            ...this.topBorrowers().map(b => [b.fullName, b.onTimePaymentPercentage, b.totalLoansCount])
          ]);
        }
        if (this.riskBorrowers().length > 0) {
          addSheet('High Risk Borrowers', [
            ['Borrower', 'Phone', 'On-Time %', 'Missed Payments', 'Defaults'],
            ...this.riskBorrowers().map(b => [b.fullName, b.phoneNumber, b.onTimePaymentPercentage, b.missedPaymentsCount, b.defaultedLoansCount])
          ]);
        }
      } else if (tab === 'revenue' && this.revenue()) {
        const r = this.revenue()!;
        addSheet('Revenue Summary', [
          ['LoanApp Revenue Report'],
          [`Period: ${this.revenueFrom} to ${this.revenueTo}`],
          [`Generated: ${now}`],
          [],
          ['Metric', 'Amount (NGN)'],
          ['Total Revenue', r.totalRevenue],
          ['Interest Income', r.totalInterestIncome],
          ['Penalty Income', r.totalPenaltyIncome],
          ['Total Disbursed', r.totalDisbursed],
          ['Total Collected', r.totalCollected],
          ['Loans Issued', r.loansIssued],
        ]);
        if (r.monthlyBreakdown?.length > 0) {
          addSheet('Monthly Breakdown', [
            ['Month', 'Interest (NGN)', 'Penalties (NGN)', 'Total Revenue (NGN)', 'Disbursed (NGN)', 'Collected (NGN)'],
            ...r.monthlyBreakdown.map((m: any) => [m.month, m.interestIncome, m.penaltyIncome, m.interestIncome + m.penaltyIncome, m.disbursed, m.collected])
          ]);
        }
      } else if (tab === 'cashflow' && this.cashFlow().length > 0) {
        const totals = this.getCashFlowTotals();
        addSheet('Cash Flow Summary', [
          ['LoanApp Cash Flow Projection'],
          [`Next ${this.cashFlowDays} Days`],
          [`Generated: ${now}`],
          [],
          ['Metric', 'Amount (NGN)'],
          ['Expected Principal', totals.principal],
          ['Expected Interest', totals.interest],
          ['Expected Total', totals.total],
        ]);
        addSheet('Daily Cash Flow', [
          ['Date', 'Expected Principal (NGN)', 'Expected Interest (NGN)', 'Total Expected (NGN)'],
          ...this.cashFlow().map((cf: any) => [new Date(cf.date).toLocaleDateString('en-NG'), cf.expectedPrincipal, cf.expectedInterest, cf.expectedTotal])
        ]);
      } else if (tab === 'portfolio' && this.health()) {
        const h = this.health()!;
        addSheet('Portfolio Health', [
          ['LoanApp Portfolio Health Report'],
          [`Generated: ${now}`],
          [],
          ['Metric', 'Value (%)'],
          ['On-Time Rate', h.percentOnTime],
          ['Due Soon', h.percentDue],
          ['Overdue', h.percentOverdue],
          ['At Risk', h.percentAtRisk],
          ['Defaulted', h.percentDefaulted],
          [],
          ['PAR Metric', 'Value (%)'],
          ['PAR 30 (30+ days overdue)', h.par30],
          ['PAR 60 (60+ days overdue)', h.par60],
          ['PAR 90 (90+ days overdue)', h.par90],
        ]);
      } else if (tab === 'recollection' && this.riskBorrowers().length > 0) {
        addSheet('Recollection List', [
          ['LoanApp Recollection Report'],
          [`Generated: ${now}`],
          [],
          ['Borrower', 'Phone', 'On-Time %', 'Missed Payments', 'Defaults'],
          ...this.riskBorrowers().map(b => [b.fullName, b.phoneNumber, b.onTimePaymentPercentage, b.missedPaymentsCount, b.defaultedLoansCount])
        ]);
      }

      XLSX.writeFile(wb, `LoanApp_Report_${tab}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error('Excel export failed', e);
      alert('Excel export failed. Please try again.');
    } finally {
      this.exporting.set(false);
    }
  }
}
