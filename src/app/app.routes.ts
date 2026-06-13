import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'borrowers', loadComponent: () => import('./features/borrowers/borrowers-list.component').then(m => m.BorrowersListComponent) },
      { path: 'borrowers/new', loadComponent: () => import('./features/borrowers/borrower-form.component').then(m => m.BorrowerFormComponent) },
      { path: 'borrowers/:id', loadComponent: () => import('./features/borrowers/borrower-detail.component').then(m => m.BorrowerDetailComponent) },
      { path: 'borrowers/:id/edit', loadComponent: () => import('./features/borrowers/borrower-form.component').then(m => m.BorrowerFormComponent) },
      { path: 'loans', loadComponent: () => import('./features/loans/loans-list.component').then(m => m.LoansListComponent) },
      { path: 'loans/new', loadComponent: () => import('./features/loans/loan-form.component').then(m => m.LoanFormComponent) },
      { path: 'loans/calculator', loadComponent: () => import('./features/loans/loan-calculator.component').then(m => m.LoanCalculatorComponent) },
      { path: 'loans/:id', loadComponent: () => import('./features/loans/loan-detail.component').then(m => m.LoanDetailComponent) },
      { path: 'payments', loadComponent: () => import('./features/payments/payments-list.component').then(m => m.PaymentsListComponent) },
      { path: 'payments/record', loadComponent: () => import('./features/payments/record-payment.component').then(m => m.RecordPaymentComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
