import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="login-shell">
      <div class="login-left">
        <div class="brand">
          <div class="brand-icon">💰</div>
          <h1>LoanMS</h1>
          <p>Microfinance Management System</p>
        </div>
        <div class="stats-preview">
          <div class="preview-stat">
            <span class="val">₦24M+</span>
            <span class="lbl">Portfolio Managed</span>
          </div>
          <div class="preview-stat">
            <span class="val">1,200+</span>
            <span class="lbl">Active Borrowers</span>
          </div>
          <div class="preview-stat">
            <span class="val">94%</span>
            <span class="lbl">Collection Rate</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <h2>Sign in</h2>
          <p class="sub">Enter your credentials to access the dashboard</p>

          @if (error()) {
            <div class="alert alert-danger">⚠ {{ error() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Email address</label>
              <input type="email" class="form-control" formControlName="email" placeholder="you@company.com" autocomplete="email">
              @if (form.get('email')?.touched && form.get('email')?.invalid) {
                <div class="invalid-feedback">Valid email required</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-control" formControlName="password" placeholder="••••••••" autocomplete="current-password">
              @if (form.get('password')?.touched && form.get('password')?.invalid) {
                <div class="invalid-feedback">Password required</div>
              }
            </div>

            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:8px" [disabled]="loading() || form.invalid">
              @if (loading()) { <span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> }
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .login-left {
      background: var(--navy-900);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px;
    }
    .brand { color: #fff; margin-bottom: 48px; }
    .brand-icon { font-size: 40px; margin-bottom: 12px; }
    .brand h1 { font-size: 2rem; color: var(--gold-400); margin-bottom: 6px; }
    .brand p { color: rgba(255,255,255,.45); font-size: 14px; }
    .stats-preview { display: flex; gap: 32px; }
    .preview-stat { display: flex; flex-direction: column; gap: 4px; }
    .preview-stat .val { font-size: 1.5rem; font-weight: 700; color: var(--gold-400); }
    .preview-stat .lbl { font-size: 11px; color: rgba(255,255,255,.35); text-transform: uppercase; letter-spacing: .5px; }

    .login-right {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: var(--surface-2);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 36px;
      box-shadow: var(--shadow-lg);
    }
    .login-card h2 { margin-bottom: 4px; }
    .sub { color: var(--text-muted); font-size: 13px; margin-bottom: 24px; }

    @media (max-width: 768px) {
      .login-shell { grid-template-columns: 1fr; }
      .login-left { display: none; }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message || 'Invalid credentials. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
