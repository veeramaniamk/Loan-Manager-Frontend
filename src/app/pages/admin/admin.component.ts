import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { User, MonthlyActivity, SecurityLog } from '../../core/models/loan.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="container admin-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🛡️ Admin Console</h1>
          <p class="page-subtitle">Manage users, audit pending debt totals, monitor monthly activity & inspect security logs</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs">
        <button 
          class="tab-link" 
          [class.active]="activeTab === 'users'" 
          (click)="switchTab('users')"
        >
          👥 User Management & Pending Debt Totals
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab === 'activity'" 
          (click)="switchTab('activity')"
        >
          📈 Monthly Activity & Growth
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab === 'logs'" 
          (click)="switchTab('logs')"
        >
          🚨 Security & Failure Audit Logs
        </button>
      </div>

      <!-- TAB 1: User Management & Pending Totals -->
      @if (activeTab === 'users') {
        <div class="tab-content">
          <div class="content-action-bar">
            <div>
              <h3>All Registered Users & Balances</h3>
              <p class="text-muted">Total pending loan amounts under each user's portfolio</p>
            </div>
            <button class="btn btn-primary" (click)="openAddUserModal()">
              <span>➕ Add New User</span>
            </button>
          </div>

          @if (loadingUsers) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Calculating user debt balances...</p>
            </div>
          } @else {
            <div class="card p-0">
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Loans Count</th>
                      <th>Pending Receivable</th>
                      <th>Pending Payable</th>
                      <th>Total User Pending</th>
                      <th style="text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (u of users; track u.id) {
                      <tr>
                        <td>
                          <div class="user-cell">
                            <strong>{{ u.full_name }}</strong>
                            <span class="user-sub text-muted">&#64;{{ u.username }} • {{ u.email }}</span>
                          </div>
                        </td>
                        <td>
                          <span class="badge" [ngClass]="u.role === 'admin' ? 'badge-primary' : 'badge-secondary'">
                            {{ u.role }}
                          </span>
                        </td>
                        <td>
                          <span class="badge" [ngClass]="u.status === 'active' ? 'badge-success' : 'badge-danger'">
                            {{ u.status }}
                          </span>
                        </td>
                        <td>
                          <span class="badge badge-secondary">{{ u.total_loans || 0 }} loans</span>
                        </td>
                        <td>
                          <strong class="text-success">
                            {{ u.pendingReceivable | currency:'INR':'symbol':'1.0-0' }}
                          </strong>
                        </td>
                        <td>
                          <strong class="text-danger">
                            {{ u.pendingPayable | currency:'INR':'symbol':'1.0-0' }}
                          </strong>
                        </td>
                        <td>
                          <strong class="total-pending-badge">
                            {{ u.totalPending | currency:'INR':'symbol':'1.0-0' }}
                          </strong>
                        </td>
                        <td style="text-align: right;">
                          <div class="row-actions">
                            <button class="btn btn-secondary btn-sm" (click)="openEditUserModal(u)">
                              Edit
                            </button>
                            @if (u.id !== authService.currentUser()?.id) {
                              <button class="btn btn-danger btn-sm" (click)="deleteUser(u)">
                                Delete
                              </button>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 2: Monthly Activity & Trends -->
      @if (activeTab === 'activity') {
        <div class="tab-content">
          <div class="content-action-bar">
            <div>
              <h3>Monthly Activity & Volume Overview</h3>
              <p class="text-muted">Month-by-month financial summary and transaction velocity across users</p>
            </div>
            <button class="btn btn-secondary" (click)="loadMonthlyActivity()">
              <span>🔄 Refresh</span>
            </button>
          </div>

          @if (loadingActivity) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Aggregating monthly transactions...</p>
            </div>
          } @else if (monthlyActivity.length === 0) {
            <div class="card empty-card">
              <p class="text-muted">No monthly transaction activity recorded yet.</p>
            </div>
          } @else {
            <div class="card p-0">
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Month Period</th>
                      <th>Loans Created</th>
                      <th>Total Given (Lent)</th>
                      <th>Total Taken (Borrowed)</th>
                      <th>Payments Repaid</th>
                      <th>Active Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of monthlyActivity; track m.month) {
                      <tr>
                        <td>
                          <strong class="month-label">📅 {{ m.month }}</strong>
                        </td>
                        <td>
                          <span class="badge badge-info">{{ m.loansCreated }} loans</span>
                        </td>
                        <td>
                          <strong class="text-success">{{ m.givenAmount | currency:'INR':'symbol':'1.0-0' }}</strong>
                        </td>
                        <td>
                          <strong class="text-danger">{{ m.takenAmount | currency:'INR':'symbol':'1.0-0' }}</strong>
                        </td>
                        <td>
                          <strong class="text-primary">{{ m.repaidAmount | currency:'INR':'symbol':'1.0-0' }}</strong>
                          <span class="text-muted">({{ m.paymentsCount }} payments)</span>
                        </td>
                        <td>
                          <span class="badge badge-secondary">👥 {{ m.activeUsers }} users</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 3: Security & Validation Failure Audit Logs -->
      @if (activeTab === 'logs') {
        <div class="tab-content">
          <div class="content-action-bar">
            <div>
              <h3>Security & Validation Failure Audit Logs</h3>
              <p class="text-muted">Every rejected request (Cookie, Session, CSRF, JWT failures) automatically recorded in database</p>
            </div>
            <button class="btn btn-secondary" (click)="loadSecurityLogs()">
              <span>🔄 Refresh Logs</span>
            </button>
          </div>

          @if (loadingLogs) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Fetching security audit logs from MySQL...</p>
            </div>
          } @else if (securityLogs.length === 0) {
            <div class="card empty-card">
              <span class="empty-icon">🛡️</span>
              <h3>No security failures logged</h3>
              <p class="text-muted">All incoming API requests are passing the 4-layer validation pipeline smoothly.</p>
            </div>
          } @else {
            <div class="card p-0">
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Method & URL</th>
                      <th>Status</th>
                      <th>Client Type</th>
                      <th>Failure Reason</th>
                      <th style="text-align: right;">Inspection</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (log of securityLogs; track log.id) {
                      <tr>
                        <td>
                          <span class="log-time">{{ log.created_at | date:'dd MMM, HH:mm:ss' }}</span>
                        </td>
                        <td>
                          <code>{{ log.method }} {{ log.url }}</code>
                        </td>
                        <td>
                          <span class="badge" [ngClass]="log.status_code >= 500 ? 'badge-danger' : (log.status_code === 403 ? 'badge-warning' : 'badge-danger')">
                            {{ log.status_code }}
                          </span>
                        </td>
                        <td>
                          <span class="badge badge-secondary">{{ log.client_type }}</span>
                        </td>
                        <td>
                          <span class="failure-text">{{ log.failure_reason }}</span>
                        </td>
                        <td style="text-align: right;">
                          <button class="btn btn-secondary btn-sm" (click)="viewLogDetails(log)">
                            Inspect Details
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- Add / Edit User Modal -->
      @if (showUserModal) {
        <div class="modal-overlay" (click)="closeUserModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingUserId ? 'Edit User' : '➕ Create New User' }}</h3>
              <button class="btn btn-sm btn-secondary" (click)="closeUserModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (userModalError) {
                <div class="alert alert-danger">{{ userModalError }}</div>
              }

              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" [(ngModel)]="userFormData.full_name" placeholder="e.g. Priya Sharma" required />
              </div>

              <div class="form-group">
                <label class="form-label">Username *</label>
                <input type="text" class="form-control" [(ngModel)]="userFormData.username" placeholder="priya" [disabled]="!!editingUserId" required />
              </div>

              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" class="form-control" [(ngModel)]="userFormData.email" placeholder="priya@example.com" required />
              </div>

              <div class="form-group">
                <label class="form-label">{{ editingUserId ? 'Reset Password (Leave blank to keep existing)' : 'Password *' }}</label>
                <input type="password" class="form-control" [(ngModel)]="userFormData.password" placeholder="••••••••" />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Role</label>
                  <select class="form-control" [(ngModel)]="userFormData.role">
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Account Status</label>
                  <select class="form-control" [(ngModel)]="userFormData.status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Disabled</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeUserModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitUser()" [disabled]="savingUser">
                {{ savingUser ? 'Saving...' : 'Save User' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Inspect Log Detail Modal -->
      @if (selectedLog) {
        <div class="modal-overlay" (click)="closeLogModal()">
          <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3>🔍 Security Log Inspection #{{ selectedLog.id }}</h3>
                <span class="badge" [ngClass]="selectedLog.status_code >= 500 ? 'badge-danger' : 'badge-warning'">
                  Status {{ selectedLog.status_code }} • {{ selectedLog.client_type }}
                </span>
              </div>
              <button class="btn btn-sm btn-secondary" (click)="closeLogModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="log-detail-section">
                <label class="detail-label">Failure Diagnostic Reason:</label>
                <div class="alert alert-danger">{{ selectedLog.failure_reason }}</div>
              </div>

              <div class="log-meta-grid">
                <div>
                  <label class="detail-label">Endpoint:</label>
                  <code>{{ selectedLog.method }} {{ selectedLog.url }}</code>
                </div>
                <div>
                  <label class="detail-label">IP Address:</label>
                  <span>{{ selectedLog.ip_address }}</span>
                </div>
                <div>
                  <label class="detail-label">Timestamp:</label>
                  <span>{{ selectedLog.created_at | date:'medium' }}</span>
                </div>
                <div>
                  <label class="detail-label">User ID:</label>
                  <span>{{ selectedLog.user_id || 'Unauthenticated' }}</span>
                </div>
              </div>

              <div class="log-detail-section">
                <label class="detail-label">Headers (Sanitized):</label>
                <pre class="json-box">{{ formatJson(selectedLog.headers) }}</pre>
              </div>

              <div class="log-detail-section">
                <label class="detail-label">Request Body (Sanitized):</label>
                <pre class="json-box">{{ formatJson(selectedLog.body) }}</pre>
              </div>

              <div class="log-detail-section">
                <label class="detail-label">Response Payload Returned to Client:</label>
                <pre class="json-box">{{ formatJson(selectedLog.response_body) }}</pre>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeLogModal()">Close Inspector</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    .page-header {
      margin-bottom: 1.5rem;
    }
    .page-title {
      font-size: 1.85rem;
    }
    .page-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    @media (max-width: 768px) {
      .admin-container {
        padding-top: 1rem;
        padding-bottom: 1.5rem;
      }
      .page-header {
        margin-bottom: 1rem;
      }
      .page-title {
        font-size: 1.45rem;
      }
      .page-subtitle {
        font-size: 0.825rem;
      }
      .admin-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding-bottom: 2px;
        margin-bottom: 1rem;
        gap: 0.25rem;
      }
      .admin-tabs::-webkit-scrollbar {
        display: none;
      }
      .tab-link {
        flex-shrink: 0;
        padding: 0.6rem 0.85rem !important;
        font-size: 0.8rem !important;
        white-space: nowrap;
      }
      .content-action-bar {
        flex-direction: column;
        align-items: stretch !important;
        gap: 0.75rem !important;
        margin-bottom: 1rem !important;
      }
      .content-action-bar .btn {
        width: 100%;
      }
      .form-row {
        flex-direction: column;
        gap: 0.75rem;
      }
      .log-meta-grid {
        grid-template-columns: 1fr !important;
        gap: 0.5rem !important;
        padding: 0.75rem !important;
      }
      .json-box {
        font-size: 0.725rem !important;
        padding: 0.75rem !important;
        max-height: 180px !important;
      }
    }
    .tab-link {
      background: none;
      border: none;
      padding: 0.75rem 1.25rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
    }
    .tab-link:hover {
      color: var(--primary);
    }
    .tab-link.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .content-action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .p-0 { padding: 0 !important; }
    .user-cell {
      display: flex;
      flex-direction: column;
    }
    .user-sub {
      font-size: 0.75rem;
    }
    .total-pending-badge {
      font-size: 0.95rem;
      color: #1e293b;
      background: #f1f5f9;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-sm);
    }
    .row-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    .month-label {
      font-size: 0.95rem;
    }
    .log-time {
      font-size: 0.775rem;
      color: var(--text-muted);
    }
    .failure-text {
      font-size: 0.8rem;
      color: #991b1b;
      font-weight: 600;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .flex-1 { flex: 1; }
    .modal-lg {
      max-width: 780px;
    }
    .log-detail-section {
      margin-bottom: 1.25rem;
    }
    .detail-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 0.35rem;
      display: block;
    }
    .log-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
      font-size: 0.85rem;
    }
    .json-box {
      background: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      max-height: 220px;
      overflow-y: auto;
      font-family: monospace;
    }
    .empty-card {
      text-align: center;
      padding: 4rem 1rem;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: var(--primary);
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AdminComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  activeTab: 'users' | 'activity' | 'logs' = 'users';

  // Users tab
  users: User[] = this.getCachedUsers();
  loadingUsers = this.users.length === 0;
  showUserModal = false;
  editingUserId: number | null = null;
  userFormData = {
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  };
  userModalError = '';
  savingUser = false;

  // Monthly Activity tab
  monthlyActivity: MonthlyActivity[] = [];
  loadingActivity = false;

  // Security Logs tab
  securityLogs: SecurityLog[] = [];
  loadingLogs = false;
  selectedLog: SecurityLog | null = null;

  private getCachedUsers(): User[] {
    try {
      const cached = localStorage.getItem('lm_admin_users');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  ngOnInit() {
    this.loadUsers();
  }

  switchTab(tab: 'users' | 'activity' | 'logs') {
    this.activeTab = tab;
    this.cdr.markForCheck();
    if (tab === 'activity' && this.monthlyActivity.length === 0) {
      this.loadMonthlyActivity();
    } else if (tab === 'logs' && this.securityLogs.length === 0) {
      this.loadSecurityLogs();
    }
  }

  loadUsers() {
    if (this.users.length === 0) {
      this.loadingUsers = true;
    }
    this.cdr.markForCheck();
    this.apiService.getAdminUsers().subscribe({
      next: (res) => {
        this.loadingUsers = false;
        if (res.success) {
          this.users = res.data;
          try {
            localStorage.setItem('lm_admin_users', JSON.stringify(res.data));
          } catch {}
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingUsers = false;
        console.error('Error fetching admin users:', err);
        this.cdr.markForCheck();
      }
    });
  }

  loadMonthlyActivity() {
    this.loadingActivity = true;
    this.cdr.markForCheck();
    this.apiService.getAdminMonthlyActivity().subscribe({
      next: (res) => {
        this.loadingActivity = false;
        if (res.success) {
          this.monthlyActivity = res.data;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingActivity = false;
        console.error('Error fetching monthly activity:', err);
        this.cdr.markForCheck();
      }
    });
  }

  loadSecurityLogs() {
    this.loadingLogs = true;
    this.cdr.markForCheck();
    this.apiService.getAdminSecurityLogs(60).subscribe({
      next: (res) => {
        this.loadingLogs = false;
        if (res.success) {
          this.securityLogs = res.data;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingLogs = false;
        console.error('Error fetching security logs:', err);
        this.cdr.markForCheck();
      }
    });
  }

  openAddUserModal() {
    this.editingUserId = null;
    this.userFormData = {
      full_name: '',
      username: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active'
    };
    this.userModalError = '';
    this.showUserModal = true;
  }

  openEditUserModal(user: User) {
    this.editingUserId = user.id;
    this.userFormData = {
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status || 'active'
    };
    this.userModalError = '';
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
  }

  submitUser() {
    if (!this.userFormData.full_name.trim() || !this.userFormData.email.trim()) {
      this.userModalError = 'Full name and email are required.';
      return;
    }

    if (!this.editingUserId && (!this.userFormData.username.trim() || !this.userFormData.password)) {
      this.userModalError = 'Username and password are required for new users.';
      return;
    }

    this.savingUser = true;
    this.userModalError = '';

    if (this.editingUserId) {
      this.apiService.updateAdminUser(this.editingUserId, this.userFormData).subscribe({
        next: () => {
          this.savingUser = false;
          this.closeUserModal();
          this.loadUsers();
        },
        error: (err) => {
          this.savingUser = false;
          this.userModalError = err.error?.error || 'Failed to update user.';
        }
      });
    } else {
      this.apiService.createAdminUser(this.userFormData as any).subscribe({
        next: () => {
          this.savingUser = false;
          this.closeUserModal();
          this.loadUsers();
        },
        error: (err) => {
          this.savingUser = false;
          this.userModalError = err.error?.error || 'Failed to create user.';
        }
      });
    }
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete user ${user.username} (${user.full_name})? All their records will be removed.`)) {
      this.apiService.deleteAdminUser(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert(err.error?.error || 'Failed to delete user.')
      });
    }
  }

  viewLogDetails(log: SecurityLog) {
    this.selectedLog = log;
  }

  closeLogModal() {
    this.selectedLog = null;
  }

  formatJson(data: any): string {
    if (!data) return 'None';
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(data);
    }
  }
}
