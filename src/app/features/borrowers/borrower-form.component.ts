import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BorrowerService } from '../../core/services/api.services';

@Component({
  selector: 'app-borrower-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h2>{{ isEdit() ? 'Edit Borrower' : 'Register New Borrower' }}</h2>
      <div class="breadcrumb">
        <a routerLink="/borrowers" style="color:var(--navy-600)">Borrowers</a> / {{ isEdit() ? 'Edit' : 'New' }}
      </div>
    </div>

    @if (success()) {
      <div class="alert alert-success">✓ Borrower {{ isEdit() ? 'updated' : 'registered' }} successfully!</div>
    }
    @if (error()) {
      <div class="alert alert-danger">⚠ {{ error() }}</div>
    }

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="grid-2">
        <!-- Personal Info -->
        <div class="card">
          <div class="card-header"><h4>Personal Information</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input class="form-control" formControlName="fullName" placeholder="As on ID card">
              @if (hasError('fullName')) { <div class="invalid-feedback">Full name is required</div> }
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input class="form-control" formControlName="phoneNumber" placeholder="08012345678">
                @if (hasError('phoneNumber')) { <div class="invalid-feedback">Phone required</div> }
              </div>
              <div class="form-group">
                <label class="form-label">Alternate Phone</label>
                <input class="form-control" formControlName="alternatePhoneNumber" placeholder="Optional">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" formControlName="email" placeholder="Optional">
            </div>
            <div class="form-group">
              <label class="form-label">National ID Number (NIN) *</label>
              <input class="form-control" formControlName="nationalIdNumber" placeholder="Enter 11-digit NIN">
              @if (hasError('nationalIdNumber')) { <div class="invalid-feedback">NIN is required</div> }
            </div>
            <div class="form-group">
              <label class="form-label">Home Address</label>
              <textarea class="form-control" formControlName="homeAddress" rows="2" placeholder="Full residential address"></textarea>
            </div>
          </div>
        </div>

        <!-- Work & Guarantor -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-header"><h4>Employment / Business</h4></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Employer or Business Name</label>
                <input class="form-control" formControlName="employerOrBusiness" placeholder="Where borrower works or business name">
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h4>Guarantor Information</h4></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Guarantor Full Name</label>
                <input class="form-control" formControlName="guarantorName" placeholder="Guarantor's full name">
              </div>
              <div class="form-group">
                <label class="form-label">Guarantor Phone</label>
                <input class="form-control" formControlName="guarantorPhone" placeholder="Guarantor's phone number">
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h4>Actions</h4></div>
            <div class="card-body" style="display:flex;gap:8px">
              <button type="submit" class="btn btn-gold btn-lg" [disabled]="loading() || form.invalid">
                @if (loading()) { <span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> }
                {{ isEdit() ? 'Save Changes' : 'Register Borrower' }}
              </button>
              <a routerLink="/borrowers" class="btn btn-outline btn-lg">Cancel</a>
            </div>
          </div>
        </div>
      </div>
    </form>
  `
})
export class BorrowerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private svc = inject(BorrowerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  loading = signal(false);
  success = signal(false);
  error = signal('');
  borrowerId = signal<number | null>(null);

  form = this.fb.group({
    fullName: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    alternatePhoneNumber: [''],
    email: [''],
    nationalIdNumber: ['', Validators.required],
    homeAddress: [''],
    employerOrBusiness: [''],
    guarantorName: [''],
    guarantorPhone: ['']
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.borrowerId.set(+id);
      this.svc.getById(+id).subscribe(b => this.form.patchValue(b as any));
    }
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const data = this.form.value as any;

    const obs = this.isEdit()
      ? this.svc.update(this.borrowerId()!, data)
      : this.svc.create(data);

    obs.subscribe({
      next: (b: any) => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/borrowers', b.borrowerId || this.borrowerId()]), 1500);
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'An error occurred. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
