import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary, Loan } from '../../core/models/loan.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="container dashboard-container">
      <!-- Welcome Header -->
      <div class="dash-header">
        <div>
          <h1 class="dash-title">Financial Dashboard</h1>
          <p class="dash-subtitle">
            Welcome back, <strong>{{ authService.currentUser()?.full_name }}</strong>. Here is your current loan and cashflow position.
          </p>
        </div>
        <div class="dash-actions">
          <a routerLink="/loans" class="btn btn-primary">
            <span>➕ Add New Loan</span>
          </a>
          <button class="btn btn-secondary" (click)="loadDashboard()" [disabled]="loading">
            <span>🔄 Refresh</span>
          </button>
        </div>
      </div>

      @if (loading && !summary) {
        <div class="metrics-grid">
          <div class="metric-card skeleton-card">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line big"></div>
            <div class="skeleton-line medium"></div>
          </div>
          <div class="metric-card skeleton-card">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line big"></div>
            <div class="skeleton-line medium"></div>
          </div>
          <div class="metric-card skeleton-card">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line big"></div>
            <div class="skeleton-line medium"></div>
          </div>
          <div class="metric-card skeleton-card">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line big"></div>
            <div class="skeleton-line medium"></div>
          </div>
        </div>
      } @else if (summary) {
        <!-- KPI Metrics Grid -->
        <div class="metrics-grid">
          <!-- Pending Receivable (People owe me) -->
          <div class="metric-card metric-card-receivable">
            <div class="metric-header">
              <span class="metric-icon">📥</span>
              <span class="metric-label">To Receive (From People)</span>
            </div>
            <div class="metric-value text-success">
              {{ summary.metrics.pendingReceivable | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="metric-footer">
              <span>Given to <strong>{{ summary.peopleOweMe.length }}</strong> people pending collection</span>
            </div>
          </div>

          <!-- Pending Payable (I have to give) -->
          <div class="metric-card metric-card-payable">
            <div class="metric-header">
              <span class="metric-icon">📤</span>
              <span class="metric-label">To Give (Payable by You)</span>
            </div>
            <div class="metric-value text-danger">
              {{ summary.metrics.pendingPayable | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="metric-footer">
              <span>Obligation to <strong>{{ summary.peopleIOwe.length }}</strong> people by due date</span>
            </div>
          </div>

          <!-- Today Spent -->
          <div class="metric-card metric-card-spent">
            <div class="metric-header">
              <span class="metric-icon">💸</span>
              <span class="metric-label">Spent Today</span>
            </div>
            <div class="metric-value text-warning">
              {{ summary.metrics.todaySpent | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="metric-footer">
              <span>Cash out: loans given + payments made today</span>
            </div>
          </div>

          <!-- Today Came (Received) -->
          <div class="metric-card metric-card-received">
            <div class="metric-header">
              <span class="metric-icon">💰</span>
              <span class="metric-label">Received Today</span>
            </div>
            <div class="metric-value text-primary">
              {{ summary.metrics.todayReceived | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="metric-footer">
              <span>Cash in: collections + borrowed today</span>
            </div>
          </div>
        </div>

        <!-- Net Summary Strip -->
        <div class="net-summary-strip">
          <div class="net-item">
            <span class="net-title">Total Net Debt Standing:</span>
            <span class="net-val" [ngClass]="summary.metrics.netPosition >= 0 ? 'text-success' : 'text-danger'">
              {{ (summary.metrics.netPosition >= 0 ? '+' : '') }}
              {{ summary.metrics.netPosition | currency:'INR':'symbol':'1.0-0' }}
              <small>({{ summary.metrics.netPosition >= 0 ? 'You are in Surplus' : 'You have Net Debt' }})</small>
            </span>
          </div>
          <div class="net-item">
            <span class="net-title">Today's Net Cashflow:</span>
            <span class="net-val" [ngClass]="summary.metrics.todayNet >= 0 ? 'text-success' : 'text-danger'">
              {{ (summary.metrics.todayNet >= 0 ? '+' : '') }}
              {{ summary.metrics.todayNet | currency:'INR':'symbol':'1.0-0' }}
            </span>
          </div>
        </div>

        <!-- Overdue or Due Today Alerts -->
        @if (urgentLoans.length > 0) {
          <div class="urgent-banner">
            <div class="urgent-title">
              <span>⚠️ Action Needed: {{ urgentLoans.length }} Loan(s) Due Today or Overdue</span>
            </div>
            <div class="urgent-list">
              @for (loan of urgentLoans; track loan.id) {
                <div class="urgent-item">
                  <div class="urgent-info">
                    <strong>{{ loan.person_name }}</strong>
                    <span class="urgent-desc">
                      {{ loan.type === 'given' ? 'Needs to return you' : 'You must pay' }}
                      <strong>{{ loan.remaining_balance | currency:'INR':'symbol':'1.0-0' }}</strong>
                    </span>
                    <span class="badge" [ngClass]="loan.is_due_today ? 'badge-warning' : 'badge-danger'">
                      {{ loan.is_due_today ? 'Due Today' : 'Overdue (' + (loan.due_date | date:'mediumDate') + ')' }}
                    </span>
                  </div>
                  <button class="btn btn-sm" [ngClass]="loan.type === 'given' ? 'btn-success' : 'btn-danger'" (click)="openPaymentModal(loan)">
                    {{ loan.type === 'given' ? 'Collect ₹' : 'Pay ₹' }}
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- Dual Column Tables: Who Owes Me vs Who I Have to Give -->
        <div class="split-grid">
          <!-- 1. People Who Owe Me (Given / Pending Receivable) -->
          <div class="card table-card">
            <div class="table-card-header">
              <div>
                <h3 class="table-title text-success">📥 People Who Owe Me</h3>
                <span class="table-subtitle">Pending loan receivables given to people</span>
              </div>
              <span class="badge badge-success">{{ summary.peopleOweMe.length }} Active</span>
            </div>

            @if (summary.peopleOweMe.length === 0) {
              <div class="empty-box">
                <span>🎉 No pending receivables! Everyone has settled their loans.</span>
              </div>
            } @else {
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Person & Contact</th>
                      <th>Due Date</th>
                      <th>Location</th>
                      <th style="text-align: right;">Pending (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (loan of summary.peopleOweMe; track loan.id) {
                      <tr>
                        <td>
                          <div class="person-cell">
                            <span class="name">{{ loan.person_name }}</span>
                            <span class="phone text-muted">{{ loan.person_phone || 'No phone' }}</span>
                          </div>
                        </td>
                        <td>
                          @if (loan.due_date) {
                            <span [ngClass]="{'text-danger': loan.is_overdue, 'text-warning': loan.is_due_today}">
                              {{ loan.due_date | date:'dd MMM yyyy' }}
                            </span>
                            @if (loan.is_overdue) {
                              <span class="badge badge-danger">Overdue</span>
                            } @else if (loan.is_due_today) {
                              <span class="badge badge-warning">Due Today</span>
                            }
                          } @else {
                            <span class="text-muted">No Due Date</span>
                          }
                        </td>
                        <td>
                          <span class="loc-tag">📍 {{ loan.location || 'Not set' }}</span>
                        </td>
                        <td style="text-align: right;">
                          <strong class="amount text-success">
                            {{ loan.remaining_balance | currency:'INR':'symbol':'1.0-0' }}
                          </strong>
                          <span class="original-amt text-muted">of {{ loan.principal_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                        </td>
                        <td>
                          <button class="btn btn-success btn-sm" (click)="openPaymentModal(loan)">
                            Collect
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- 2. People I Have to Give (Taken / Pending Payable by Date) -->
          <div class="card table-card">
            <div class="table-card-header">
              <div>
                <h3 class="table-title text-danger">📤 People I Have To Give</h3>
                <span class="table-subtitle">Borrowed amounts and obligations with scheduled dates</span>
              </div>
              <span class="badge badge-danger">{{ summary.peopleIOwe.length }} Active</span>
            </div>

            @if (summary.peopleIOwe.length === 0) {
              <div class="empty-box">
                <span>🌟 Zero debt obligations! You do not owe anyone right now.</span>
              </div>
            } @else {
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Person & Contact</th>
                      <th>Pay By Date</th>
                      <th>Location</th>
                      <th style="text-align: right;">To Give (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (loan of summary.peopleIOwe; track loan.id) {
                      <tr>
                        <td>
                          <div class="person-cell">
                            <span class="name">{{ loan.person_name }}</span>
                            <span class="phone text-muted">{{ loan.person_phone || 'No phone' }}</span>
                          </div>
                        </td>
                        <td>
                          @if (loan.due_date) {
                            <span [ngClass]="{'text-danger': loan.is_overdue, 'text-warning': loan.is_due_today}">
                              {{ loan.due_date | date:'dd MMM yyyy' }}
                            </span>
                            @if (loan.is_overdue) {
                              <span class="badge badge-danger">Overdue</span>
                            } @else if (loan.is_due_today) {
                              <span class="badge badge-warning">Due Today</span>
                            }
                          } @else {
                            <span class="text-muted">Flexible</span>
                          }
                        </td>
                        <td>
                          <span class="loc-tag">📍 {{ loan.location || 'Not set' }}</span>
                        </td>
                        <td style="text-align: right;">
                          <strong class="amount text-danger">
                            {{ loan.remaining_balance | currency:'INR':'symbol':'1.0-0' }}
                          </strong>
                          <span class="original-amt text-muted">of {{ loan.principal_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                        </td>
                        <td>
                          <button class="btn btn-danger btn-sm" (click)="openPaymentModal(loan)">
                            Pay Back
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>

        <!-- Location Breakdown Strip -->
        @if (summary.locationStats && summary.locationStats.length > 0) {
          <div class="card location-card">
            <h4 class="card-section-title">📍 Loans Spread by Location</h4>
            <div class="location-chips">
              @for (loc of summary.locationStats; track loc.location_name) {
                <div class="loc-chip">
                  <div class="loc-chip-title">{{ loc.location_name }}</div>
                  <div class="loc-chip-details">
                    <span class="badge badge-secondary">{{ loc.total_loans }} loans</span>
                    <span class="loc-chip-amt">{{ loc.total_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Record Payment Modal -->
      @if (selectedLoanForPayment) {
        <div class="modal-overlay" (click)="closePaymentModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>
                {{ selectedLoanForPayment.type === 'given' ? '📥 Collect Payment' : '📤 Record Repayment' }}
              </h3>
              <button class="btn btn-sm btn-secondary" (click)="closePaymentModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="modal-info-bar">
                <div>
                  <span class="text-muted">Person:</span>
                  <strong>{{ selectedLoanForPayment.person_name }}</strong>
                </div>
                <div>
                  <span class="text-muted">Remaining Balance:</span>
                  <strong class="text-danger">
                    {{ selectedLoanForPayment.remaining_balance | currency:'INR':'symbol':'1.0-0' }}
                  </strong>
                </div>
              </div>

              @if (paymentError) {
                <div class="alert alert-danger">{{ paymentError }}</div>
              }

              <div class="form-group">
                <label class="form-label">Payment Amount (₹)</label>
                <input 
                  type="number" 
                  class="form-control" 
                  [(ngModel)]="paymentAmount" 
                  [max]="selectedLoanForPayment.remaining_balance || 9999999"
                  placeholder="Enter amount"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Payment Date</label>
                <input type="date" class="form-control" [(ngModel)]="paymentDate" />
              </div>

              <div class="form-group">
                <label class="form-label">Payment Method</label>
                <select class="form-control" [(ngModel)]="paymentMethod">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Notes / Remarks</label>
                <input type="text" class="form-control" [(ngModel)]="paymentNotes" placeholder="e.g. Received via GPay" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closePaymentModal()">Cancel</button>
              <button 
                class="btn" 
                [ngClass]="selectedLoanForPayment.type === 'given' ? 'btn-success' : 'btn-danger'" 
                (click)="submitPayment()"
                [disabled]="submittingPayment"
              >
                {{ submittingPayment ? 'Recording...' : 'Confirm & Save' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .dash-title {
      font-size: 1.85rem;
      color: #0f172a;
      letter-spacing: -0.03em;
    }
    .dash-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 0.25rem;
    }
    .dash-actions {
      display: flex;
      gap: 0.75rem;
    }
    .loading-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-muted);
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
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }
    .metric-card-receivable::before { background: #10b981; }
    .metric-card-payable::before { background: #f43f5e; }
    .metric-card-spent::before { background: #f59e0b; }
    .metric-card-received::before { background: #6366f1; }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .metric-icon {
      font-size: 1.25rem;
    }
    .metric-label {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 0.5rem;
    }
    .metric-footer {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-top: auto;
    }
    .net-summary-strip {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-around;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .net-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .net-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .net-val {
      font-size: 1.15rem;
      font-weight: 800;
    }
    .urgent-banner {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }
    .urgent-title {
      font-weight: 700;
      color: #92400e;
      margin-bottom: 0.75rem;
      font-size: 0.95rem;
    }
    .urgent-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .urgent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid #fef3c7;
    }
    .urgent-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .urgent-desc {
      font-size: 0.875rem;
      color: #475569;
    }
    .split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 960px) {
      .split-grid {
        grid-template-columns: 1fr;
      }
    }
    .table-card {
      padding: 1.25rem;
    }
    .table-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .table-title {
      font-size: 1.15rem;
    }
    .table-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .person-cell {
      display: flex;
      flex-direction: column;
    }
    .person-cell .name {
      font-weight: 700;
      color: var(--text-main);
    }
    .person-cell .phone {
      font-size: 0.75rem;
    }
    .loc-tag {
      font-size: 0.775rem;
      color: #475569;
    }
    .amount {
      display: block;
      font-size: 0.95rem;
    }
    .original-amt {
      display: block;
      font-size: 0.725rem;
    }
    .empty-box {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-muted);
      font-size: 0.875rem;
      background: #f8fafc;
      border-radius: var(--radius-md);
    }
    .location-card {
      padding: 1.25rem 1.5rem;
    }
    .card-section-title {
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .location-chips {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .loc-chip {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      flex: 1;
      min-width: 180px;
    }
    .loc-chip-title {
      font-weight: 700;
      font-size: 0.875rem;
      margin-bottom: 0.35rem;
    }
    .loc-chip-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .loc-chip-amt {
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--primary);
    }
    .modal-info-bar {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
    }
    .skeleton-card {
      min-height: 140px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      justify-content: center;
      background: #ffffff;
    }
    .skeleton-line {
      height: 14px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-sm);
    }
    .skeleton-line.short { width: 40%; height: 12px; }
    .skeleton-line.big { width: 70%; height: 28px; }
    .skeleton-line.medium { width: 85%; height: 12px; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);

  summary: DashboardSummary | null = this.getCachedSummary();
  loading = !this.summary;

  // Repayment Modal
  selectedLoanForPayment: Loan | null = null;
  paymentAmount: number = 0;
  paymentDate: string = new Date().toISOString().slice(0, 10);
  paymentMethod: string = 'upi';
  paymentNotes: string = '';
  submittingPayment = false;
  paymentError = '';

  private getCachedSummary(): DashboardSummary | null {
    try {
      const cached = localStorage.getItem('lm_dash_summary');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    if (!this.summary) {
      this.loading = true;
    }
    this.apiService.getDashboardSummary().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.summary = res.data;
          try {
            localStorage.setItem('lm_dash_summary', JSON.stringify(res.data));
          } catch {}
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load dashboard:', err);
      }
    });
  }

  get urgentLoans(): Loan[] {
    if (!this.summary) return [];
    const all = [...this.summary.peopleOweMe, ...this.summary.peopleIOwe];
    return all.filter(l => l.is_due_today || l.is_overdue);
  }

  openPaymentModal(loan: Loan) {
    this.selectedLoanForPayment = loan;
    this.paymentAmount = Number(loan.remaining_balance) || Number(loan.principal_amount);
    this.paymentDate = new Date().toISOString().slice(0, 10);
    this.paymentMethod = 'upi';
    this.paymentNotes = '';
    this.paymentError = '';
  }

  closePaymentModal() {
    this.selectedLoanForPayment = null;
    this.paymentError = '';
  }

  submitPayment() {
    if (!this.selectedLoanForPayment) return;
    if (!this.paymentAmount || this.paymentAmount <= 0) {
      this.paymentError = 'Please enter a valid payment amount';
      return;
    }

    this.submittingPayment = true;
    this.apiService.addLoanPayment(this.selectedLoanForPayment.id, {
      amount: this.paymentAmount,
      payment_date: this.paymentDate,
      payment_method: this.paymentMethod,
      notes: this.paymentNotes
    }).subscribe({
      next: () => {
        this.submittingPayment = false;
        this.closePaymentModal();
        this.loadDashboard(); // Refresh metrics instantly
      },
      error: (err) => {
        this.submittingPayment = false;
        this.paymentError = err.error?.error || 'Failed to record payment';
      }
    });
  }
}
