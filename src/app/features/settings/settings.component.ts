import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header flex-between">
      <div>
        <h2>Settings</h2>
        <div class="breadcrumb">System configuration and user management</div>
      </div>
    </div>

    <div class="grid-2">
      <!-- Change Password -->
      <div class="card">
        <div class="card-header"><h4>Change Password</h4></div>
        <div class="card-body">
          @if (pwSuccess()) { <div class="alert alert-success">✓ Password changed successfully</div> }
          @if (pwError()) { <div class="alert alert-danger">⚠ {{ pwError() }}</div> }
          <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" class="form-control" formControlName="currentPassword">
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" class="form-control" formControlName="newPassword">
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input type="password" class="form-control" formControlName="confirmPassword">
            </div>
            <button type="submit" class="btn btn-gold" [disabled]="pwLoading() || pwForm.invalid">
              Change Password
            </button>
          </form>
        </div>
      </div>

      <!-- Register User (Owner only) -->
      @if (isOwner()) {
        <div class="card">
          <div class="card-header"><h4>Register New User</h4></div>
          <div class="card-body">
            @if (regSuccess()) { <div class="alert alert-success">✓ User registered successfully</div> }
            @if (regError()) { <div class="alert alert-danger">⚠ {{ regError() }}</div> }
            <form [formGroup]="regForm" (ngSubmit)="registerUser()">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input class="form-control" formControlName="fullName">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" formControlName="email">
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input class="form-control" formControlName="phoneNumber">
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-control" formControlName="role">
                  <option value="1">Admin</option>
                  <option value="2">Loan Officer</option>
                  <option value="3">Collector</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" formControlName="password">
              </div>
              <button type="submit" class="btn btn-gold" [disabled]="regLoading() || regForm.invalid">
                Register User
              </button>
            </form>
          </div>
        </div>
      }

      <!-- Profile Info -->
      <div class="card">
        <div class="card-header"><h4>My Profile</h4></div>
        <div class="card-body">
          @if (currentUser()) {
            <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
              <div class="flex-between" style="padding-bottom:10px;border-bottom:1px solid var(--border)">
                <span style="color:var(--text-muted)">Name</span>
                <span style="font-weight:600">{{ currentUser()!.fullName }}</span>
              </div>
              <div class="flex-between" style="padding-bottom:10px;border-bottom:1px solid var(--border)">
                <span style="color:var(--text-muted)">Email</span>
                <span>{{ currentUser()!.email }}</span>
              </div>
              <div class="flex-between" style="padding-bottom:10px;border-bottom:1px solid var(--border)">
                <span style="color:var(--text-muted)">Role</span>
                <span class="badge" style="background:var(--navy-900);color:var(--gold-400);padding:3px 10px;border-radius:4px;font-size:11px">
                  {{ currentUser()!.role }}
                </span>
              </div>
              <div class="flex-between">
                <span style="color:var(--text-muted)">User ID</span>
                <code>#{{ currentUser()!.userId }}</code>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userSvc = inject(UserService);
  private auth = inject(AuthService);

  pwLoading = signal(false);
  pwSuccess = signal(false);
  pwError = signal('');
  regLoading = signal(false);
  regSuccess = signal(false);
  regError = signal('');
  currentUser = signal(this.auth.getCurrentUser());

  isOwner() { return this.auth.hasRole('Owner'); }

  pwForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  regForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    role: [1, Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit() {}

  changePassword() {
    if (this.pwForm.invalid) return;
    this.pwLoading.set(true);
    this.userSvc.changePassword(this.pwForm.value).subscribe({
      next: () => { this.pwSuccess.set(true); this.pwLoading.set(false); this.pwForm.reset(); },
      error: (err: any) => { this.pwError.set(err.error?.message || 'Failed to change password'); this.pwLoading.set(false); }
    });
  }

  registerUser() {
    if (this.regForm.invalid) return;
    this.regLoading.set(true);
    this.userSvc.register(this.regForm.value as any).subscribe({
      next: () => { this.regSuccess.set(true); this.regLoading.set(false); this.regForm.reset({ role: 1 }); },
      error: (err: any) => { this.regError.set(err.error?.message || 'Failed to register user'); this.regLoading.set(false); }
    });
  }
}
