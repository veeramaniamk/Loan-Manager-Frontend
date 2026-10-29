import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar-wrapper">
      <div class="nav-container">
        <div class="nav-left">
          <a routerLink="/dashboard" class="brand">
            <span class="brand-icon">💰</span>
            <div class="brand-text">
              <span class="brand-title">LoanManager</span>
              <span class="brand-subtitle">Finance & Debt Tracker</span>
            </div>
          </a>

          @if (authService.isAuthenticated()) {
            <nav class="nav-links">
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
                <span class="nav-icon">📊</span> Dashboard
              </a>
              <a routerLink="/loans" routerLinkActive="active" class="nav-item">
                <span class="nav-icon">📜</span> Loans Ledger
              </a>
              <a routerLink="/people" routerLinkActive="active" class="nav-item">
                <span class="nav-icon">👥</span> People
              </a>
              @if (authService.isAdmin()) {
                <a routerLink="/admin" routerLinkActive="active" class="nav-item nav-item-admin">
                  <span class="nav-icon">🛡️</span> Admin Console
                </a>
              }
            </nav>
          }
        </div>

        <div class="nav-right">
          @if (authService.isAuthenticated()) {
            <div class="security-chip" title="Session, Cookie, CSRF & JWT Active">
              <span class="pulse-dot"></span>
              <span>Protected</span>
            </div>

            <div class="user-profile">
              <div class="avatar">{{ userInitials }}</div>
              <div class="user-info">
                <span class="user-name">{{ authService.currentUser()?.full_name }}</span>
                <span class="user-role badge" [ngClass]="authService.isAdmin() ? 'badge-primary' : 'badge-secondary'">
                  {{ authService.currentUser()?.role }}
                </span>
              </div>
            </div>

            <button class="btn btn-secondary btn-sm logout-btn" (click)="onLogout()" title="Log Out">
              <span>Sign Out</span>
            </button>
          } @else {
            <a routerLink="/login" class="btn btn-primary btn-sm">Sign In</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .nav-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 2.5rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-icon {
      font-size: 1.75rem;
      background: #f1f5f9;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
    }
    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      display: block;
      line-height: 1.2;
    }
    .brand-subtitle {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-weight: 500;
      display: block;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-item {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.9rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.15s ease;
    }
    .nav-item:hover {
      color: var(--primary);
      background: var(--primary-light);
    }
    .nav-item.active {
      color: var(--primary);
      background: var(--primary-light);
    }
    .nav-item-admin {
      color: #7c3aed;
    }
    .nav-item-admin:hover, .nav-item-admin.active {
      color: #6d28d9;
      background: #f5f3ff;
    }
    .nav-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .security-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 0.725rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }
    .user-role {
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      align-self: flex-start;
      margin-top: 2px;
    }
    @media (max-width: 900px) {
      .brand-subtitle, .security-chip, .user-info {
        display: none;
      }
      .nav-container {
        padding: 0.5rem 1rem;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  get userInitials(): string {
    const name = this.authService.currentUser()?.full_name || 'User';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  onLogout() {
    this.authService.logout();
  }
}
