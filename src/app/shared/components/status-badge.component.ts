import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanStatus } from '../../core/models/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="getClass()">{{ getLabel() }}</span>
  `,
  styles: [`
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge-pending    { background: #fef3c7; color: #92400e; }
    .badge-approved   { background: #dbeafe; color: #1e40af; }
    .badge-active     { background: #d1fae5; color: #065f46; }
    .badge-overdue    { background: #fee2e2; color: #991b1b; }
    .badge-defaulted  { background: #1f1f1f; color: #fca5a5; }
    .badge-closed     { background: #f3f4f6; color: #6b7280; }
    .badge-due        { background: #fde68a; color: #78350f; }
    .badge-atrisk     { background: #fce7f3; color: #9d174d; }
    .badge-partial    { background: #e0e7ff; color: #3730a3; }
    .badge-upcoming   { background: #e0f2fe; color: #0c4a6e; }
  `]
})
export class StatusBadgeComponent {
  @Input() status!: number;

  getLabel(): string {
    return LoanStatus[this.status] || 'Unknown';
  }

  getClass(): string {
    const map: Record<number, string> = {
      0: 'badge-closed', 1: 'badge-pending', 2: 'badge-approved',
      3: 'badge-active', 4: 'badge-upcoming', 5: 'badge-due',
      6: 'badge-overdue', 7: 'badge-partial', 8: 'badge-atrisk',
      9: 'badge-defaulted'
    };
    return map[this.status] || 'badge-pending';
  }
}
