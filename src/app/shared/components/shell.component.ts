import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles?: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <!-- Sidebar -->
      <nav class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-logo">
          <div class="logo-mark">💰 LoanMS</div>
          <div class="logo-sub">Management System</div>
        </div>

        <div style="flex:1; overflow-y:auto; padding: 8px 0;">
          <div class="nav-section">Main</div>
          @for (item of mainNav; track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active" (click)="closeSidebar()">
              <span class="icon">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }

          <div class="nav-section" style="margin-top:16px">Operations</div>
          @for (item of opsNav; track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active" (click)="closeSidebar()">
              <span class="icon">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }

          <div class="nav-section" style="margin-top:16px">Tools</div>
          @for (item of toolsNav; track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active" (click)="closeSidebar()">
              <span class="icon">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </div>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ getInitials() }}</div>
            <div>
              <div class="user-name">{{ currentUser()?.fullName || 'User' }}</div>
              <div class="user-role">{{ currentUser()?.role }}</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" style="width:100%;margin-top:10px;color:rgba(255,255,255,.5);border-color:rgba(255,255,255,.1)" (click)="logout()">
            Sign Out
          </button>
        </div>
      </nav>

      <!-- Main -->
      <div class="main-content">
        <header class="topbar">
          <button class="btn btn-icon" style="display:none" (click)="toggleSidebar()">☰</button>
          <div style="font-size:13px;color:var(--text-muted)">{{ today }}</div>
          <div class="flex-center gap-2">
            <a routerLink="/loans/calculator" class="btn btn-gold btn-sm">
              🧮 Loan Calculator
            </a>
            <a routerLink="/payments/record" class="btn btn-primary btn-sm">
              + Record Payment
            </a>
          </div>
        </header>

        <main class="page-content">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile overlay -->
      @if (sidebarOpen()) {
        <div style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99;" (click)="closeSidebar()"></div>
      }
    </div>
  `
})
export class ShellComponent {
  private auth = inject(AuthService);
  sidebarOpen = signal(false);
  currentUser = this.auth.currentUser;
  today = new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  mainNav: NavItem[] = [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Borrowers', icon: '👥', path: '/borrowers' },
    { label: 'Loans', icon: '📋', path: '/loans' },
  ];

  opsNav: NavItem[] = [
    { label: 'Payments', icon: '💳', path: '/payments' },
    { label: 'Reports', icon: '📈', path: '/reports' },
  ];

  toolsNav: NavItem[] = [
    { label: 'Calculator', icon: '🧮', path: '/loans/calculator' },
    { label: 'Settings', icon: '⚙️', path: '/settings' },
  ];

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar() { this.sidebarOpen.set(false); }

  getInitials(): string {
    const user = this.auth.getCurrentUser();
    if (!user?.fullName) return 'U';
    return user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  logout() { this.auth.logout(); }
}
