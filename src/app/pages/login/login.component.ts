import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">💰</div>
          <h2 class="auth-title">{{ isRegisterMode ? 'Create Account' : 'Welcome to LoanManager' }}</h2>
          <p class="auth-desc">
            {{ isRegisterMode ? 'Register to start tracking personal loans & repayments' : 'Securely manage your loans by people, dates & locations' }}
          </p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-danger">
            <span>⚠️</span>
            <div>{{ errorMessage }}</div>
          </div>
        }

        @if (successMessage) {
          <div class="alert alert-success">
            <span>✅</span>
            <div>{{ successMessage }}</div>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          @if (isRegisterMode) {
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input 
                type="text" 
                class="form-control" 
                placeholder="e.g. Ramesh Babu" 
                [(ngModel)]="fullName" 
                name="fullName" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input 
                type="email" 
                class="form-control" 
                placeholder="name@example.com" 
                [(ngModel)]="email" 
                name="email" 
                required 
              />
            </div>
          }

          <div class="form-group">
            <label class="form-label">Username</label>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Username or Email" 
              [(ngModel)]="username" 
              name="username" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              class="form-control" 
              placeholder="••••••••" 
              [(ngModel)]="password" 
              name="password" 
              required 
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            @if (loading) {
              <span>Authenticating...</span>
            } @else {
              <span>{{ isRegisterMode ? 'Register Account' : 'Sign In with Secure Session' }}</span>
            }
          </button>
        </form>

        @if (!isRegisterMode) {
          <!-- Demo Accounts Helper -->
          <div class="demo-box">
            <span class="demo-title">Quick Demo Login:</span>
            <div class="demo-buttons">
              <button type="button" class="btn btn-secondary btn-sm" (click)="fillDemo('admin')">
                🛡️ Demo Admin (admin)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" (click)="fillDemo('user')">
                👤 Demo User (veera)
              </button>
            </div>
          </div>
        }

        <div class="auth-footer">
          @if (isRegisterMode) {
            <span>Already have an account?</span>
            <a href="javascript:void(0)" (click)="toggleMode()" class="auth-link">Sign In</a>
          } @else {
            <span>Need a new account?</span>
            <a href="javascript:void(0)" (click)="toggleMode()" class="auth-link">Sign Up</a>
          }
        </div>

        <div class="security-guarantee">
          <span>🔒 Protected by Session, HttpCookie, CSRF Token & JWT Pipeline</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 65px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }
    .auth-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-logo {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      display: inline-block;
    }
    .auth-title {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .auth-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .btn-block {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.95rem;
      margin-top: 0.5rem;
    }
    .demo-box {
      margin-top: 1.5rem;
      padding: 0.85rem;
      background: #f8fafc;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      text-align: center;
    }
    .demo-title {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .demo-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }
    .auth-footer {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .auth-link {
      color: var(--primary);
      font-weight: 700;
      margin-left: 0.35rem;
    }
    .auth-link:hover {
      text-decoration: underline;
    }
    .security-guarantee {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.725rem;
      color: #64748b;
      font-weight: 600;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isRegisterMode = false;
  username = '';
  password = '';
  fullName = '';
  email = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  fillDemo(type: 'admin' | 'user') {
    if (type === 'admin') {
      this.username = 'admin';
      this.password = 'admin123';
    } else {
      this.username = 'veera';
      this.password = 'veera123';
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.loading = true;

    if (this.isRegisterMode) {
      if (!this.fullName || !this.email) {
        this.errorMessage = 'Full name and email are required for registration';
        this.loading = false;
        return;
      }

      this.authService.register({
        username: this.username,
        email: this.email,
        password: this.password,
        full_name: this.fullName
      }).subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = 'Registration successful! You can now log in.';
          this.isRegisterMode = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.error || 'Registration failed. Try a different username/email.';
        }
      });
    } else {
      this.authService.login({
        username: this.username,
        password: this.password
      }).subscribe({
        next: (res) => {
          this.loading = false;
          let returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (!returnUrl || returnUrl === '/login') {
            returnUrl = res.user?.role === 'admin' ? '/admin' : '/dashboard';
          }
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.error || 'Invalid credentials or validation pipeline error';
        }
      });
    }
  }
}
