import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { 
  DailyExpense, 
  ExpenseTag, 
  ExpensePaymentMethod, 
  ExpenseOverviewSummary 
} from '../../core/models/loan.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="container expenses-container">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">💸 Daily Expense Tracker</h1>
          <p class="page-subtitle">Track your everyday spending on bus, food, snacks, cinema & more with custom tags and UPI / Cash tracking</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAddExpenseModal()">
            <span>➕ Add Expense</span>
          </button>
          <button class="btn btn-secondary" (click)="openManageTagsModal()">
            <span>🏷️ Manage Tags</span>
          </button>
          <button class="btn btn-secondary" (click)="openManageMethodsModal()">
            <span>📱 UPI & Payment Apps</span>
          </button>
          <button class="btn btn-secondary" (click)="refreshAll()" [disabled]="loading">
            <span>🔄 Refresh</span>
          </button>
        </div>
      </div>

      <!-- Messages / Feedback -->
      @if (errorMessage) {
        <div class="alert alert-danger">
          <span>⚠️ {{ errorMessage }}</span>
        </div>
      }
      @if (successMessage) {
        <div class="alert alert-success">
          <span>✅ {{ successMessage }}</span>
        </div>
      }

      <!-- Main Navigation Tabs: Overview vs History -->
      <div class="tab-bar">
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'overview'" 
          (click)="setTab('overview')">
          <span>📊 Spending Overview</span>
          @if (overview?.mode === 'yearly') {
            <span class="badge badge-info tab-badge">Yearly ({{ selectedYear }})</span>
          } @else {
            <span class="badge badge-info tab-badge">Monthly ({{ overview?.monthName || 'Current' }})</span>
          }
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'entries'" 
          (click)="setTab('entries')">
          <span>📜 Expense Entries</span>
          <span class="badge badge-secondary tab-badge">{{ expenses.length }}</span>
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 1: 📊 SPENDING OVERVIEW (Monthly by default, Yearly option) -->
      <!-- ======================================================== -->
      @if (activeTab === 'overview') {
        <div class="overview-section">
          <!-- Overview Mode & Period Controller -->
          <div class="card period-controller-card">
            <div class="period-controls-row">
              <!-- Mode Toggle Buttons -->
              <div class="mode-toggle-group">
                <button 
                  type="button" 
                  class="toggle-btn" 
                  [class.active]="overviewMode === 'monthly'" 
                  (click)="setOverviewMode('monthly')">
                  📅 Monthly Overview <small>(Default)</small>
                </button>
                <button 
                  type="button" 
                  class="toggle-btn" 
                  [class.active]="overviewMode === 'yearly'" 
                  (click)="setOverviewMode('yearly')">
                  📆 Yearly Overview
                </button>
              </div>

              <!-- Period Selectors & Jump Navigation -->
              <div class="period-nav-group">
                @if (overviewMode === 'monthly') {
                  <button class="btn btn-secondary btn-sm nav-arrow-btn" (click)="prevMonth()" title="Previous Month">
                    ◀ Prev
                  </button>

                  <select class="form-control select-inline" [(ngModel)]="selectedMonth" (change)="loadOverview()">
                    @for (m of monthsList; track m.val) {
                      <option [value]="m.val">{{ m.name }}</option>
                    }
                  </select>

                  <select class="form-control select-inline select-year" [(ngModel)]="selectedYear" (change)="loadOverview()">
                    @for (yr of yearsList; track yr) {
                      <option [value]="yr">{{ yr }}</option>
                    }
                  </select>

                  <button class="btn btn-secondary btn-sm nav-arrow-btn" (click)="nextMonth()" title="Next Month">
                    Next ▶
                  </button>

                  <button class="btn btn-secondary btn-sm" (click)="jumpToCurrentMonth()">
                    Today
                  </button>
                } @else {
                  <button class="btn btn-secondary btn-sm nav-arrow-btn" (click)="prevYear()" title="Previous Year">
                    ◀ Prev Year
                  </button>

                  <select class="form-control select-inline select-year-wide" [(ngModel)]="selectedYear" (change)="loadOverview()">
                    @for (yr of yearsList; track yr) {
                      <option [value]="yr">Year {{ yr }}</option>
                    }
                  </select>

                  <button class="btn btn-secondary btn-sm nav-arrow-btn" (click)="nextYear()" title="Next Year">
                    Next Year ▶
                  </button>

                  <button class="btn btn-secondary btn-sm" (click)="jumpToCurrentYear()">
                    This Year
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- KPI Metrics Grid -->
          @if (overview) {
            <div class="metrics-grid">
              <!-- Total Spent Metric -->
              <div class="metric-card metric-card-spent">
                <div class="metric-header">
                  <span class="metric-icon">💸</span>
                  <span class="metric-label">
                    {{ overview.mode === 'yearly' ? 'Total Spent in ' + overview.year : 'Total Spent (' + overview.monthName + ')' }}
                  </span>
                </div>
                <div class="metric-value text-danger">
                  {{ overview.totalSpent | currency:'INR':'symbol':'1.0-0' }}
                </div>
                <div class="metric-footer">
                  <span>{{ overview.transactionsCount }} transactions recorded</span>
                </div>
              </div>

              <!-- Daily or Monthly Average -->
              <div class="metric-card metric-card-avg">
                <div class="metric-header">
                  <span class="metric-icon">📈</span>
                  <span class="metric-label">
                    {{ overview.mode === 'yearly' ? 'Monthly Average' : 'Daily Average' }}
                  </span>
                </div>
                <div class="metric-value text-primary">
                  @if (overview.mode === 'yearly') {
                    {{ (overview.monthlyAverage || 0) | currency:'INR':'symbol':'1.0-0' }} / mo
                  } @else {
                    {{ (overview.dailyAverage || 0) | currency:'INR':'symbol':'1.0-0' }} / day
                  }
                </div>
                <div class="metric-footer">
                  <span>Based on active period expenditures</span>
                </div>
              </div>

              <!-- Today's Spending -->
              <div class="metric-card metric-card-today">
                <div class="metric-header">
                  <span class="metric-icon">⚡</span>
                  <span class="metric-label">Today's Expense</span>
                </div>
                <div class="metric-value text-warning">
                  {{ overview.todaySpent | currency:'INR':'symbol':'1.0-0' }}
                </div>
                <div class="metric-footer">
                  <span>Expenses recorded today</span>
                </div>
              </div>

              <!-- Payment Split (Cash vs UPI) -->
              <div class="metric-card metric-card-split">
                <div class="metric-header">
                  <span class="metric-icon">💳</span>
                  <span class="metric-label">Payment Mode Split</span>
                </div>
                <div class="split-stats">
                  <div class="split-item">
                    <span class="split-badge badge-upi">📱 UPI:</span>
                    <strong>{{ overview.upiSpent | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </div>
                  <div class="split-item">
                    <span class="split-badge badge-cash">💵 Cash:</span>
                    <strong>{{ overview.cashSpent | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </div>
                </div>
                <div class="split-bar-wrapper">
                  <div 
                    class="split-bar upi-bar" 
                    [style.width.%]="overview.totalSpent > 0 ? (overview.upiSpent / overview.totalSpent * 100) : 50"
                    title="UPI Spending">
                  </div>
                  <div 
                    class="split-bar cash-bar" 
                    [style.width.%]="overview.totalSpent > 0 ? (overview.cashSpent / overview.totalSpent * 100) : 50"
                    title="Cash Spending">
                  </div>
                </div>
              </div>
            </div>

            <!-- Breakdown Visuals: 2 Column Layout -->
            <div class="overview-grid">
              <!-- Column 1: Category / Tag Breakdown -->
              <div class="card breakdown-card">
                <div class="card-header-styled">
                  <div class="card-title-group">
                    <span class="card-icon">🏷️</span>
                    <div>
                      <h3 class="card-title">Category & Tag Breakdown</h3>
                      <p class="card-subtitle">Spending by category (bus, food, snacks, cinema, etc.)</p>
                    </div>
                  </div>
                  <button class="btn btn-secondary btn-sm" (click)="openManageTagsModal()">
                    <span>⚙️ Manage</span>
                  </button>
                </div>

                @if (overview.tagBreakdown.length === 0) {
                  <div class="empty-mini-state">
                    <span class="empty-icon">🏷️</span>
                    <p>No tagged expenses in this period.</p>
                    <button class="btn btn-sm btn-primary" (click)="openAddExpenseModal()">Add Expense</button>
                  </div>
                } @else {
                  <div class="breakdown-list">
                    @for (item of overview.tagBreakdown; track (item.tag_id || item.tag_name)) {
                      <div class="breakdown-item">
                        <div class="breakdown-item-head">
                          <div class="breakdown-tag-badge" [style.borderLeftColor]="item.tag_color">
                            <span class="tag-icon-bubble" [style.backgroundColor]="item.tag_color + '22'" [style.color]="item.tag_color">
                              {{ item.tag_icon }}
                            </span>
                            <span class="tag-title-text">{{ item.tag_name }}</span>
                            <span class="tag-count-chip">{{ item.count }} items</span>
                          </div>
                          <div class="breakdown-amount-group">
                            <span class="breakdown-amount">{{ item.total_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                            <span class="badge badge-secondary breakdown-pct">{{ item.percentage }}%</span>
                          </div>
                        </div>
                        <div class="progress-track">
                          <div 
                            class="progress-fill" 
                            [style.width.%]="item.percentage" 
                            [style.backgroundColor]="item.tag_color">
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Column 2: Payment Mode & UPI App Breakdown -->
              <div class="card breakdown-card">
                <div class="card-header-styled">
                  <div class="card-title-group">
                    <span class="card-icon">📱</span>
                    <div>
                      <h3 class="card-title">Paid Through (UPI Apps & Cash)</h3>
                      <p class="card-subtitle">Breakdown by payment app (BHIM, GPay, PhonePe, Navi UPI, Cash)</p>
                    </div>
                  </div>
                  <button class="btn btn-secondary btn-sm" (click)="openManageMethodsModal()">
                    <span>⚙️ Manage Apps</span>
                  </button>
                </div>

                @if (overview.paymentBreakdown.length === 0) {
                  <div class="empty-mini-state">
                    <span class="empty-icon">📱</span>
                    <p>No payment records in this period.</p>
                  </div>
                } @else {
                  <div class="breakdown-list">
                    @for (pay of overview.paymentBreakdown; track pay.method_name) {
                      <div class="breakdown-item">
                        <div class="breakdown-item-head">
                          <div class="breakdown-tag-badge">
                            <span class="tag-icon-bubble upi-app-bubble">
                              {{ pay.method_icon }}
                            </span>
                            <div>
                              <span class="tag-title-text">{{ pay.method_name }}</span>
                              <span class="badge" [ngClass]="pay.payment_type === 'cash' ? 'badge-warning' : 'badge-info'" style="margin-left: 0.4rem; font-size: 0.65rem;">
                                {{ pay.payment_type | uppercase }}
                              </span>
                            </div>
                            <span class="tag-count-chip">{{ pay.count }} txns</span>
                          </div>
                          <div class="breakdown-amount-group">
                            <span class="breakdown-amount">{{ pay.total_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                            <span class="badge badge-secondary breakdown-pct">{{ pay.percentage }}%</span>
                          </div>
                        </div>
                        <div class="progress-track">
                          <div 
                            class="progress-fill upi-progress-fill" 
                            [style.width.%]="pay.percentage">
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Trend Section: Monthly Day-by-Day OR Yearly Month-by-Month -->
            @if (overview.mode === 'yearly' && overview.monthlyBreakdown) {
              <div class="card trend-card">
                <div class="card-header-styled">
                  <div class="card-title-group">
                    <span class="card-icon">📊</span>
                    <div>
                      <h3 class="card-title">Annual Month-by-Month Spend Trend ({{ overview.year }})</h3>
                      <p class="card-subtitle">Compare your monthly expenditures throughout the entire year</p>
                    </div>
                  </div>
                  @if (overview.highestMonth) {
                    <span class="badge badge-warning">
                      🏆 Peak: {{ overview.highestMonth.monthName }} ({{ overview.highestMonth.amount | currency:'INR':'symbol':'1.0-0' }})
                    </span>
                  }
                </div>

                <div class="monthly-bars-grid">
                  @for (m of overview.monthlyBreakdown; track m.month) {
                    <div class="month-bar-col" [class.highlight]="m.month === overview.highestMonth?.month">
                      <div class="bar-amount">{{ m.total_amount > 0 ? (m.total_amount | currency:'INR':'symbol':'1.0-0') : '-' }}</div>
                      <div class="bar-container">
                        <div 
                          class="bar-fill" 
                          [style.height.%]="getYearlyBarHeight(m.total_amount)" 
                          [title]="m.monthName + ': ' + (m.total_amount | currency:'INR':'symbol':'1.0-0')">
                        </div>
                      </div>
                      <div class="bar-label">{{ m.monthName.slice(0, 3) }}</div>
                      <div class="bar-count">{{ m.count }} txns</div>
                    </div>
                  }
                </div>
              </div>
            } @else if (overview.mode === 'monthly' && overview.dailyBreakdown) {
              <div class="card trend-card">
                <div class="card-header-styled">
                  <div class="card-title-group">
                    <span class="card-icon">📅</span>
                    <div>
                      <h3 class="card-title">Daily Spending Log in {{ overview.monthName }} {{ overview.year }}</h3>
                      <p class="card-subtitle">Active spending days and transaction frequency</p>
                    </div>
                  </div>
                  <span class="badge badge-secondary">{{ overview.dailyBreakdown.length }} active days</span>
                </div>

                @if (overview.dailyBreakdown.length === 0) {
                  <div class="empty-mini-state">
                    <p>No daily spending recorded for {{ overview.monthName }} {{ overview.year }}.</p>
                  </div>
                } @else {
                  <div class="daily-chips-grid">
                    @for (day of overview.dailyBreakdown; track day.date) {
                      <div class="daily-chip" (click)="filterByDate(day.date)" title="Click to view entries for this date">
                        <div class="daily-chip-date">
                          <span class="day-num">{{ day.day }}</span>
                          <span class="day-month">{{ overview.monthName?.slice(0, 3) }}</span>
                        </div>
                        <div class="daily-chip-info">
                          <span class="daily-chip-amount">{{ day.total_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                          <span class="daily-chip-count">{{ day.count }} txns</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
      }

      <!-- ======================================================== -->
      <!-- TAB 2: 📜 EXPENSE ENTRIES (Filterable List) -->
      <!-- ======================================================== -->
      @if (activeTab === 'entries') {
        <div class="entries-section">
          <!-- Filters Card -->
          <div class="card filter-card">
            <div class="filter-grid">
              <!-- Search Title & Notes -->
              <div class="filter-item search-filter">
                <label class="form-label">🔍 Search</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Search bus, food, snacks, movie..." 
                  [(ngModel)]="searchQuery" 
                  (input)="applyFilters()">
              </div>

              <!-- Filter by Tag -->
              <div class="filter-item">
                <label class="form-label">🏷️ Category Tag</label>
                <select class="form-control" [(ngModel)]="filterTagId" (change)="applyFilters()">
                  <option value="all">All Categories</option>
                  @for (tag of tags; track tag.id) {
                    <option [value]="tag.id">{{ tag.icon }} {{ tag.name }}</option>
                  }
                </select>
              </div>

              <!-- Filter by Payment Mode -->
              <div class="filter-item">
                <label class="form-label">💵 Mode</label>
                <select class="form-control" [(ngModel)]="filterPaymentType" (change)="applyFilters()">
                  <option value="all">All Modes</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <!-- Filter by UPI App -->
              <div class="filter-item">
                <label class="form-label">📱 Payment App</label>
                <select class="form-control" [(ngModel)]="filterMethodId" (change)="applyFilters()">
                  <option value="all">All Payment Apps</option>
                  @for (m of paymentMethods; track m.id) {
                    <option [value]="m.id">{{ m.icon }} {{ m.name }}</option>
                  }
                </select>
              </div>

              <!-- Reset Action -->
              <div class="filter-item filter-btn-item">
                <label class="form-label">&nbsp;</label>
                <button class="btn btn-secondary btn-block" (click)="resetFilters()">
                  <span>🔄 Reset</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Entries Summary Strip -->
          <div class="entries-summary-strip">
            <div class="summary-left">
              <span>Showing <strong>{{ filteredExpenses.length }}</strong> of <strong>{{ expenses.length }}</strong> expense entries</span>
            </div>
            <div class="summary-right">
              <span>Filtered Total: <strong class="text-danger">{{ totalFilteredAmount | currency:'INR':'symbol':'1.0-0' }}</strong></span>
            </div>
          </div>

          <!-- Expenses Table / Card List -->
          @if (filteredExpenses.length === 0) {
            <div class="card empty-card">
              <span class="empty-emoji">🧾</span>
              <h3>No Expenses Found</h3>
              <p class="text-muted">No expense records match your current filter criteria.</p>
              <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem;">
                <button class="btn btn-primary" (click)="openAddExpenseModal()">
                  <span>➕ Add Daily Expense</span>
                </button>
                <button class="btn btn-secondary" (click)="resetFilters()">
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          } @else {
            <div class="card table-card desktop-only">
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width: 120px;">Date</th>
                      <th>Expense & Notes</th>
                      <th style="width: 180px;">Category Tag</th>
                      <th style="width: 180px;">Paid Through</th>
                      <th style="width: 140px; text-align: right;">Amount</th>
                      <th style="width: 110px; text-align: center;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (exp of filteredExpenses; track exp.id) {
                      <tr>
                        <!-- Date -->
                        <td class="date-cell">
                          <strong>{{ exp.expense_date | date:'dd MMM yyyy' }}</strong>
                        </td>

                        <!-- Title & Notes -->
                        <td class="title-cell">
                          <div class="expense-main-title">{{ exp.title }}</div>
                          @if (exp.notes) {
                            <div class="expense-notes-text">{{ exp.notes }}</div>
                          }
                        </td>

                        <!-- Tag -->
                        <td>
                          @if (exp.tag_name) {
                            <span 
                              class="custom-tag-pill" 
                              [style.backgroundColor]="(exp.tag_color || '#4f46e5') + '1a'"
                              [style.borderColor]="exp.tag_color || '#4f46e5'"
                              [style.color]="exp.tag_color || '#4f46e5'">
                              <span>{{ exp.tag_icon || '🏷️' }}</span>
                              <span>{{ exp.tag_name }}</span>
                            </span>
                          } @else {
                            <span class="badge badge-secondary">Uncategorized</span>
                          }
                        </td>

                        <!-- Payment Method / UPI App -->
                        <td>
                          @if (exp.payment_type === 'cash') {
                            <span class="pay-method-pill pay-cash-pill">
                              <span>💵</span>
                              <span>Cash</span>
                            </span>
                          } @else {
                            <span class="pay-method-pill pay-upi-pill">
                              <span>{{ exp.method_icon || '📱' }}</span>
                              <span>{{ exp.method_name || exp.payment_app_name || 'UPI' }}</span>
                            </span>
                          }
                        </td>

                        <!-- Amount -->
                        <td style="text-align: right;">
                          <span class="amount-value text-danger">
                            -{{ exp.amount | currency:'INR':'symbol':'1.0-0' }}
                          </span>
                        </td>

                        <!-- Actions -->
                        <td style="text-align: center;">
                          <div class="action-buttons-cell">
                            <button class="icon-btn edit-icon-btn" (click)="openEditExpenseModal(exp)" title="Edit Expense">
                              ✏️
                            </button>
                            <button class="icon-btn delete-icon-btn" (click)="deleteExpense(exp)" title="Delete Expense">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Mobile Card Layout -->
            <div class="mobile-cards-list mobile-only">
              @for (exp of filteredExpenses; track exp.id) {
                <div class="card expense-mobile-card">
                  <div class="card-top-row">
                    <span class="mobile-date">{{ exp.expense_date | date:'dd MMM yyyy' }}</span>
                    <span class="mobile-amount text-danger">
                      -{{ exp.amount | currency:'INR':'symbol':'1.0-0' }}
                    </span>
                  </div>

                  <div class="mobile-title">{{ exp.title }}</div>
                  @if (exp.notes) {
                    <div class="mobile-notes">{{ exp.notes }}</div>
                  }

                  <div class="card-bottom-row">
                    <div class="mobile-badges">
                      @if (exp.tag_name) {
                        <span 
                          class="custom-tag-pill" 
                          [style.backgroundColor]="(exp.tag_color || '#4f46e5') + '1a'"
                          [style.borderColor]="exp.tag_color || '#4f46e5'"
                          [style.color]="exp.tag_color || '#4f46e5'">
                          <span>{{ exp.tag_icon || '🏷️' }}</span>
                          <span>{{ exp.tag_name }}</span>
                        </span>
                      }
                      <span class="pay-method-pill" [ngClass]="exp.payment_type === 'cash' ? 'pay-cash-pill' : 'pay-upi-pill'">
                        <span>{{ exp.payment_type === 'cash' ? '💵' : (exp.method_icon || '📱') }}</span>
                        <span>{{ exp.payment_type === 'cash' ? 'Cash' : (exp.method_name || exp.payment_app_name || 'UPI') }}</span>
                      </span>
                    </div>

                    <div class="mobile-actions">
                      <button class="icon-btn" (click)="openEditExpenseModal(exp)">✏️</button>
                      <button class="icon-btn" (click)="deleteExpense(exp)">🗑️</button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL 1: ➕ ADD / EDIT DAILY EXPENSE -->
      <!-- ======================================================== -->
      @if (showExpenseModal) {
        <div class="modal-backdrop" (click)="closeExpenseModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">
                {{ isEditingExpense ? '✏️ Edit Expense' : '➕ Record Daily Expense' }}
              </h2>
              <button class="close-btn" (click)="closeExpenseModal()">&times;</button>
            </div>

            <form (ngSubmit)="saveExpense()" #expenseForm="ngForm">
              <div class="modal-body">
                <!-- Quick Preset Chips for User-Friendly Logging -->
                @if (!isEditingExpense) {
                  <div class="form-group presets-group">
                    <label class="form-label presets-label">⚡ Quick Select Common Expenses:</label>
                    <div class="preset-chips">
                      @for (p of quickPresets; track p.title) {
                        <button 
                          type="button" 
                          class="preset-chip" 
                          (click)="applyPreset(p)">
                          <span>{{ p.icon }}</span>
                          <span>{{ p.title }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- Expense Title -->
                <div class="form-group">
                  <label class="form-label required">What did you spend on? (Title)</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="e.g., Bus ticket, Lunch meals, Tea & snacks, Movie ticket..."
                    [(ngModel)]="expenseFormData.title" 
                    name="title" 
                    required>
                </div>

                <div class="form-row-2">
                  <!-- Amount -->
                  <div class="form-group">
                    <label class="form-label required">Amount (₹)</label>
                    <div class="input-prefix-wrapper">
                      <span class="input-prefix">₹</span>
                      <input 
                        type="number" 
                        class="form-control input-with-prefix" 
                        placeholder="0.00" 
                        step="0.01" 
                        min="0.5" 
                        [(ngModel)]="expenseFormData.amount" 
                        name="amount" 
                        required>
                    </div>
                  </div>

                  <!-- Date -->
                  <div class="form-group">
                    <label class="form-label required">Expense Date</label>
                    <input 
                      type="date" 
                      class="form-control" 
                      [(ngModel)]="expenseFormData.expense_date" 
                      name="expense_date" 
                      required>
                  </div>
                </div>

                <!-- Tag Option for User Friendly Categorization -->
                <div class="form-group">
                  <div class="label-with-action">
                    <label class="form-label">🏷️ Category Tag</label>
                    <button type="button" class="btn-link" (click)="openManageTagsModal()">+ Manage Tags</button>
                  </div>
                  <select class="form-control" [(ngModel)]="expenseFormData.tag_id" name="tag_id">
                    <option [ngValue]="null">-- Select a Tag (Optional) --</option>
                    @for (tag of tags; track tag.id) {
                      <option [ngValue]="tag.id">{{ tag.icon }} {{ tag.name }}</option>
                    }
                  </select>
                </div>

                <!-- Paid Through Option: UPI or Cash -->
                <div class="form-group">
                  <label class="form-label">💳 Paid Through</label>
                  <div class="pay-toggle-group">
                    <label class="pay-toggle-option" [class.selected]="expenseFormData.payment_type === 'upi'">
                      <input 
                        type="radio" 
                        name="payment_type" 
                        value="upi" 
                        [(ngModel)]="expenseFormData.payment_type">
                      <span class="radio-label">📱 UPI App</span>
                    </label>

                    <label class="pay-toggle-option" [class.selected]="expenseFormData.payment_type === 'cash'">
                      <input 
                        type="radio" 
                        name="payment_type" 
                        value="cash" 
                        [(ngModel)]="expenseFormData.payment_type">
                      <span class="radio-label">💵 Cash</span>
                    </label>

                    <label class="pay-toggle-option" [class.selected]="expenseFormData.payment_type === 'other'">
                      <input 
                        type="radio" 
                        name="payment_type" 
                        value="other" 
                        [(ngModel)]="expenseFormData.payment_type">
                      <span class="radio-label">💳 Other</span>
                    </label>
                  </div>
                </div>

                <!-- UPI App Selection (When UPI is selected) -->
                @if (expenseFormData.payment_type === 'upi') {
                  <div class="form-group upi-app-selection">
                    <div class="label-with-action">
                      <label class="form-label">Which UPI App? (Default: BHIM, GPay, PhonePe, Navi UPI)</label>
                      <button type="button" class="btn-link" (click)="openManageMethodsModal()">+ Manage UPI Apps</button>
                    </div>

                    <div class="upi-app-grid">
                      @for (app of upiMethodsList; track app.id) {
                        <button 
                          type="button" 
                          class="upi-app-btn" 
                          [class.selected]="expenseFormData.payment_method_id === app.id"
                          (click)="selectUpiApp(app)">
                          <span class="upi-btn-icon">{{ app.icon }}</span>
                          <span class="upi-btn-name">{{ app.name }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- Notes / Additional Details -->
                <div class="form-group">
                  <label class="form-label">Notes & Remarks (Optional)</label>
                  <textarea 
                    class="form-control" 
                    rows="2" 
                    placeholder="e.g., With friends at PVR, auto from Gandhipuram, etc." 
                    [(ngModel)]="expenseFormData.notes" 
                    name="notes">
                  </textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeExpenseModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="savingExpense">
                  <span>{{ savingExpense ? 'Saving...' : (isEditingExpense ? 'Update Expense' : 'Save Expense') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL 2: 🏷️ MANAGE TAGS (Separately for every user) -->
      <!-- ======================================================== -->
      @if (showTagsModal) {
        <div class="modal-backdrop" (click)="closeManageTagsModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">🏷️ Manage Your Tags</h2>
              <button class="close-btn" (click)="closeManageTagsModal()">&times;</button>
            </div>

            <div class="modal-body">
              <p class="section-hint">
                Tags are personal to your account. Create and color-code your custom spending categories.
              </p>

              <!-- Add New Tag Form -->
              <div class="add-sub-box">
                <h4 class="sub-box-title">{{ isEditingTag ? 'Edit Tag' : '➕ Create New Tag' }}</h4>
                <div class="form-row-custom">
                  <div class="form-group tag-name-group">
                    <label class="form-label">Tag Name</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="e.g., Petrol, Gym, Books, Rent" 
                      [(ngModel)]="tagFormData.name">
                  </div>

                  <div class="form-group tag-icon-group">
                    <label class="form-label">Icon</label>
                    <select class="form-control" [(ngModel)]="tagFormData.icon">
                      @for (ic of tagIconPresets; track ic) {
                        <option [value]="ic">{{ ic }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Color Palette -->
                <div class="form-group">
                  <label class="form-label">Color Theme</label>
                  <div class="color-palette">
                    @for (col of tagColorPresets; track col) {
                      <button 
                        type="button" 
                        class="color-dot" 
                        [style.backgroundColor]="col" 
                        [class.selected]="tagFormData.color === col" 
                        (click)="tagFormData.color = col">
                      </button>
                    }
                  </div>
                </div>

                <div class="sub-box-actions">
                  @if (isEditingTag) {
                    <button type="button" class="btn btn-secondary btn-sm" (click)="resetTagForm()">Cancel</button>
                    <button type="button" class="btn btn-primary btn-sm" (click)="saveTag()">Update Tag</button>
                  } @else {
                    <button type="button" class="btn btn-primary btn-sm" (click)="saveTag()">+ Add Tag</button>
                  }
                </div>
              </div>

              <!-- Existing User Tags List -->
              <div class="existing-items-box">
                <h4 class="sub-box-title">Your Current Tags ({{ tags.length }})</h4>
                <div class="tags-manager-list">
                  @for (t of tags; track t.id) {
                    <div class="tag-manager-row">
                      <div class="tag-preview-badge" [style.borderColor]="t.color" [style.color]="t.color" [style.backgroundColor]="t.color + '18'">
                        <span>{{ t.icon }}</span>
                        <strong>{{ t.name }}</strong>
                      </div>
                      <div class="tag-meta">
                        <span class="meta-count">{{ t.expense_count || 0 }} entries</span>
                        <span class="meta-amount">{{ (t.total_spent || 0) | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                      <div class="tag-actions">
                        <button class="icon-btn" (click)="startEditTag(t)" title="Edit Tag">✏️</button>
                        <button class="icon-btn" (click)="deleteTag(t)" title="Delete Tag">🗑️</button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeManageTagsModal()">Done</button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL 3: 📱 MANAGE UPI APPS & PAYMENT METHODS -->
      <!-- ======================================================== -->
      @if (showMethodsModal) {
        <div class="modal-backdrop" (click)="closeManageMethodsModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">📱 Manage UPI & Payment Apps</h2>
              <button class="close-btn" (click)="closeManageMethodsModal()">&times;</button>
            </div>

            <div class="modal-body">
              <p class="section-hint">
                Manage your payment options. Default apps include BHIM, GPay, PhonePe, and Navi UPI. You can add any custom UPI app.
              </p>

              <!-- Add New UPI App Form -->
              <div class="add-sub-box">
                <h4 class="sub-box-title">{{ isEditingMethod ? 'Edit Payment Method' : '➕ Add Payment Method / UPI App' }}</h4>
                <div class="form-row-custom">
                  <div class="form-group" style="flex: 1.5;">
                    <label class="form-label">App / Method Name</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="e.g., BHIM, GPay, PhonePe, Navi UPI, Cred..." 
                      [(ngModel)]="methodFormData.name">
                  </div>

                  <div class="form-group" style="flex: 1;">
                    <label class="form-label">Type</label>
                    <select class="form-control" [(ngModel)]="methodFormData.type">
                      <option value="upi">UPI App</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div class="form-group" style="flex: 0.8;">
                    <label class="form-label">Icon</label>
                    <select class="form-control" [(ngModel)]="methodFormData.icon">
                      @for (ic of methodIconPresets; track ic) {
                        <option [value]="ic">{{ ic }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-check-group">
                  <label class="form-check-label">
                    <input type="checkbox" [(ngModel)]="methodFormData.is_default">
                    <span>Set as default payment option</span>
                  </label>
                </div>

                <div class="sub-box-actions">
                  @if (isEditingMethod) {
                    <button type="button" class="btn btn-secondary btn-sm" (click)="resetMethodForm()">Cancel</button>
                    <button type="button" class="btn btn-primary btn-sm" (click)="saveMethod()">Update Method</button>
                  } @else {
                    <button type="button" class="btn btn-primary btn-sm" (click)="saveMethod()">+ Add Method</button>
                  }
                </div>
              </div>

              <!-- Existing Payment Methods List -->
              <div class="existing-items-box">
                <h4 class="sub-box-title">Your Configured Payment Methods ({{ paymentMethods.length }})</h4>
                <div class="methods-manager-list">
                  @for (m of paymentMethods; track m.id) {
                    <div class="method-manager-row">
                      <div class="method-preview-chip">
                        <span class="method-icon-big">{{ m.icon }}</span>
                        <div>
                          <strong>{{ m.name }}</strong>
                          @if (m.is_default) {
                            <span class="badge badge-success" style="font-size: 0.65rem; margin-left: 0.4rem;">DEFAULT</span>
                          }
                          <div class="method-type-label">{{ m.type | uppercase }}</div>
                        </div>
                      </div>
                      <div class="method-meta">
                        <span class="meta-count">{{ m.expense_count || 0 }} entries</span>
                        <span class="meta-amount">{{ (m.total_spent || 0) | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                      <div class="method-actions">
                        <button class="icon-btn" (click)="startEditMethod(m)" title="Edit Method">✏️</button>
                        <button class="icon-btn" (click)="deleteMethod(m)" title="Delete Method">🗑️</button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeManageMethodsModal()">Done</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .expenses-container {
      padding-top: 1.5rem;
      padding-bottom: 3rem;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.925rem;
      margin-top: 0.25rem;
      max-width: 700px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    /* Tab Bar */
    .tab-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      padding: 0.75rem 1.25rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-muted);
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }
    .tab-btn:hover {
      color: var(--primary);
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .tab-badge {
      font-size: 0.75rem;
    }

    /* Period Controller */
    .period-controller-card {
      margin-bottom: 1.5rem;
      padding: 1rem 1.25rem;
    }
    .period-controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .mode-toggle-group {
      display: inline-flex;
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 3px;
    }
    .toggle-btn {
      border: none;
      background: transparent;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .toggle-btn.active {
      background: #ffffff;
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      font-weight: 700;
    }
    .period-nav-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .select-inline {
      width: auto;
      min-width: 140px;
      display: inline-block;
    }
    .select-year {
      min-width: 90px;
    }
    .select-year-wide {
      min-width: 130px;
    }
    .nav-arrow-btn {
      padding: 0.4rem 0.75rem;
    }

    /* KPI Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .metric-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .metric-icon {
      font-size: 1.25rem;
    }
    .metric-value {
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }
    .metric-footer {
      font-size: 0.775rem;
      color: var(--text-light);
    }
    .split-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.6rem;
      font-size: 0.85rem;
    }
    .split-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 4px;
    }
    .badge-upi {
      background: #e0e7ff;
      color: #3730a3;
    }
    .badge-cash {
      background: #fef3c7;
      color: #92400e;
    }
    .split-bar-wrapper {
      height: 8px;
      width: 100%;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
    }
    .split-bar.upi-bar {
      background: #4f46e5;
    }
    .split-bar.cash-bar {
      background: #d97706;
    }

    /* Overview Visuals Grid */
    .overview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 900px) {
      .overview-grid {
        grid-template-columns: 1fr;
      }
    }

    .breakdown-card {
      padding: 1.25rem;
    }
    .card-header-styled {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    .card-title-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .card-icon {
      font-size: 1.35rem;
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .card-subtitle {
      font-size: 0.775rem;
      color: var(--text-muted);
    }
    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .breakdown-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .breakdown-item-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .breakdown-tag-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .tag-icon-bubble {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      font-size: 0.95rem;
    }
    .upi-app-bubble {
      background: #eef2ff;
    }
    .tag-title-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .tag-count-chip {
      font-size: 0.725rem;
      color: var(--text-muted);
      background: var(--bg-card-subtle);
      padding: 1px 6px;
      border-radius: 4px;
    }
    .breakdown-amount-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .breakdown-amount {
      font-size: 0.925rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .breakdown-pct {
      font-size: 0.75rem;
      min-width: 40px;
      text-align: right;
    }
    .progress-track {
      height: 6px;
      width: 100%;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .upi-progress-fill {
      background: linear-gradient(90deg, #4f46e5, #06b6d4);
    }

    /* Trend Card */
    .trend-card {
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .monthly-bars-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 0.5rem;
      align-items: flex-end;
      min-height: 220px;
      padding-top: 1.5rem;
      overflow-x: auto;
    }
    .month-bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .month-bar-col.highlight .bar-label {
      color: var(--warning);
      font-weight: 800;
    }
    .month-bar-col.highlight .bar-fill {
      background: linear-gradient(180deg, #f59e0b, #d97706);
    }
    .bar-amount {
      font-size: 0.675rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 6px;
      white-space: nowrap;
    }
    .bar-container {
      width: 100%;
      max-width: 40px;
      height: 130px;
      background: #f1f5f9;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }
    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #6366f1, #4f46e5);
      border-radius: 6px 6px 0 0;
      transition: height 0.3s ease;
    }
    .bar-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 6px;
    }
    .bar-count {
      font-size: 0.65rem;
      color: var(--text-light);
    }

    /* Daily Chips Grid */
    .daily-chips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
      gap: 0.75rem;
    }
    .daily-chip {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.65rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      transition: all 0.15s ease;
    }
    .daily-chip:hover {
      border-color: var(--primary);
      background: #ffffff;
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }
    .daily-chip-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.2rem 0.45rem;
      min-width: 36px;
    }
    .day-num {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--primary);
      line-height: 1;
    }
    .day-month {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .daily-chip-info {
      display: flex;
      flex-direction: column;
    }
    .daily-chip-amount {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--danger);
    }
    .daily-chip-count {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    /* Entries Filter Card */
    .filter-card {
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1.5fr 1fr;
      gap: 0.75rem;
      align-items: flex-end;
    }
    @media (max-width: 900px) {
      .filter-grid {
        grid-template-columns: 1fr 1fr;
      }
      .search-filter {
        grid-column: span 2;
      }
      .filter-btn-item {
        grid-column: span 2;
      }
    }
    .entries-summary-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.5rem 0.75rem;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Table Styles */
    .table-card {
      padding: 0;
      overflow: hidden;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      background: var(--bg-card-subtle);
      padding: 0.875rem 1rem;
      font-size: 0.775rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
    }
    .data-table td {
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }
    .data-table tr:hover {
      background: #f8fafc;
    }
    .date-cell {
      white-space: nowrap;
      color: var(--text-main);
    }
    .expense-main-title {
      font-weight: 600;
      color: var(--text-main);
    }
    .expense-notes-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .amount-value {
      font-weight: 800;
      font-size: 0.95rem;
    }

    /* Custom Tag Pills */
    .custom-tag-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
      font-size: 0.775rem;
      font-weight: 700;
      border: 1px solid transparent;
      white-space: nowrap;
    }
    .pay-method-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
      font-size: 0.775rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .pay-cash-pill {
      background: #fef3c7;
      color: #92400e;
    }
    .pay-upi-pill {
      background: #e0e7ff;
      color: #3730a3;
    }
    .action-buttons-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
    }
    .icon-btn {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.3rem 0.45rem;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s ease;
    }
    .icon-btn:hover {
      background: #f1f5f9;
      transform: scale(1.05);
    }
    .delete-icon-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }

    /* Mobile Cards */
    .mobile-cards-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .expense-mobile-card {
      padding: 1rem;
    }
    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .mobile-date {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .mobile-amount {
      font-size: 1.15rem;
      font-weight: 800;
    }
    .mobile-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .mobile-notes {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .card-bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      border-top: 1px dashed var(--border-color);
      padding-top: 0.5rem;
    }
    .mobile-badges {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    /* Modal Backdrop & Dialog */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: modalSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalSlide {
      from { transform: translateY(12px) scale(0.97); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: var(--text-muted);
      cursor: pointer;
    }
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    /* Form Styles Inside Modals */
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .input-prefix-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-prefix {
      position: absolute;
      left: 12px;
      font-weight: 700;
      color: var(--text-muted);
    }
    .input-with-prefix {
      padding-left: 28px;
    }
    .label-with-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .btn-link {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
    }
    .btn-link:hover {
      text-decoration: underline;
    }

    /* Presets Chips */
    .presets-group {
      margin-bottom: 1.25rem;
      background: var(--bg-card-subtle);
      border-radius: var(--radius-md);
      padding: 0.75rem;
    }
    .presets-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .preset-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .preset-chip {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      padding: 0.3rem 0.7rem;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-main);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;
    }
    .preset-chip:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: var(--primary-light);
    }

    /* Payment Toggle Group */
    .pay-toggle-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6rem;
    }
    .pay-toggle-option {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      cursor: pointer;
      background: #ffffff;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.15s ease;
    }
    .pay-toggle-option input {
      display: none;
    }
    .pay-toggle-option.selected {
      border-color: var(--primary);
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
    }

    /* UPI Apps Selector Grid */
    .upi-app-selection {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      margin-top: 0.75rem;
    }
    .upi-app-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
      gap: 0.5rem;
      margin-top: 0.4rem;
    }
    .upi-app-btn {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.5rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      transition: all 0.15s ease;
    }
    .upi-app-btn.selected {
      border-color: var(--primary);
      background: #eef2ff;
      box-shadow: 0 0 0 2px var(--primary);
    }
    .upi-btn-icon {
      font-size: 1.25rem;
    }
    .upi-btn-name {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-main);
    }

    /* Sub-Boxes Inside Manage Modals */
    .section-hint {
      font-size: 0.825rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .add-sub-box {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 1.25rem;
    }
    .sub-box-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.75rem;
    }
    .form-row-custom {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .tag-name-group {
      flex: 2;
    }
    .tag-icon-group {
      flex: 1;
    }
    .color-palette {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .color-dot {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 1px #cbd5e1;
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .color-dot.selected {
      transform: scale(1.2);
      box-shadow: 0 0 0 2px var(--text-main);
    }
    .sub-box-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    /* Tags & Methods List Rows in Modals */
    .tags-manager-list,
    .methods-manager-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-height: 250px;
      overflow-y: auto;
    }
    .tag-manager-row,
    .method-manager-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.75rem;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }
    .tag-preview-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
      border: 1px solid;
      font-size: 0.8rem;
    }
    .tag-meta,
    .method-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.75rem;
    }
    .meta-count {
      color: var(--text-muted);
    }
    .meta-amount {
      font-weight: 700;
      color: var(--text-main);
    }
    .tag-actions,
    .method-actions {
      display: flex;
      gap: 0.35rem;
    }
    .method-preview-chip {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .method-icon-big {
      font-size: 1.4rem;
    }
    .method-type-label {
      font-size: 0.65rem;
      color: var(--text-muted);
    }
    .form-check-group {
      margin-top: 0.5rem;
    }
    .form-check-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
    }

    /* Empty States */
    .empty-card {
      text-align: center;
      padding: 3rem 1.5rem;
    }
    .empty-emoji {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      display: block;
    }
    .empty-mini-state {
      text-align: center;
      padding: 1.5rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
  `]
})
export class ExpensesComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  // Active Tab: 'overview' | 'entries'
  activeTab: 'overview' | 'entries' = 'overview';

  // Overview Configuration
  overviewMode: 'monthly' | 'yearly' = 'monthly';
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1; // 1-12
  overview: ExpenseOverviewSummary | null = null;

  // Month & Year Options
  monthsList = [
    { val: 1, name: 'January' },
    { val: 2, name: 'February' },
    { val: 3, name: 'March' },
    { val: 4, name: 'April' },
    { val: 5, name: 'May' },
    { val: 6, name: 'June' },
    { val: 7, name: 'July' },
    { val: 8, name: 'August' },
    { val: 9, name: 'September' },
    { val: 10, name: 'October' },
    { val: 11, name: 'November' },
    { val: 12, name: 'December' }
  ];
  yearsList: number[] = [];

  // Data Collections
  expenses: DailyExpense[] = [];
  filteredExpenses: DailyExpense[] = [];
  tags: ExpenseTag[] = [];
  paymentMethods: ExpensePaymentMethod[] = [];

  // Filter States
  searchQuery: string = '';
  filterTagId: string = 'all';
  filterPaymentType: string = 'all';
  filterMethodId: string = 'all';
  totalFilteredAmount: number = 0;

  // Modals & UI States
  loading: boolean = false;
  savingExpense: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  showExpenseModal: boolean = false;
  isEditingExpense: boolean = false;
  editingExpenseId: number | null = null;
  expenseFormData = {
    title: '',
    amount: null as number | null,
    expense_date: new Date().toISOString().slice(0, 10),
    tag_id: null as number | null,
    payment_type: 'upi' as 'upi' | 'cash' | 'other',
    payment_method_id: null as number | null,
    payment_app_name: '',
    notes: ''
  };

  // Quick Preset Templates for Bus, Food, Snacks, Cinema, etc.
  quickPresets = [
    { title: 'Bus Ticket', icon: '🚌', tagKeyword: 'Bus' },
    { title: 'Lunch Meals', icon: '🍽️', tagKeyword: 'Food' },
    { title: 'Tea & Snacks', icon: '☕', tagKeyword: 'Snacks' },
    { title: 'Movie Ticket', icon: '🎬', tagKeyword: 'Movie' },
    { title: 'Groceries', icon: '🛒', tagKeyword: 'Groceries' },
    { title: 'Auto / Cab', icon: '🚕', tagKeyword: 'Bus' },
    { title: 'Pharmacy', icon: '💊', tagKeyword: 'Health' },
    { title: 'Shopping', icon: '🛍️', tagKeyword: 'Shop' }
  ];

  // Manage Tags Modal
  showTagsModal: boolean = false;
  isEditingTag: boolean = false;
  editingTagId: number | null = null;
  tagFormData = {
    name: '',
    color: '#0284c7',
    icon: '🏷️'
  };
  tagColorPresets = [
    '#0284c7', // Blue (Bus)
    '#ea580c', // Orange (Food)
    '#d97706', // Amber (Snacks)
    '#9333ea', // Purple (Movie)
    '#16a34a', // Green (Groceries)
    '#4f46e5', // Indigo (Bills)
    '#db2777', // Pink (Shopping)
    '#dc2626', // Red (Healthcare)
    '#64748b'  // Slate (Others)
  ];
  tagIconPresets = ['🚌', '🍽️', '☕', '🎬', '🛒', '💡', '🛍️', '💊', '🚗', '🏋️', '✈️', '📱', '📦', '⛽', '🏷️'];

  // Manage Payment Methods / UPI Apps Modal
  showMethodsModal: boolean = false;
  isEditingMethod: boolean = false;
  editingMethodId: number | null = null;
  methodFormData = {
    type: 'upi' as 'upi' | 'cash' | 'other',
    name: '',
    icon: '📱',
    is_default: false
  };
  methodIconPresets = ['🇮🇳', '🌐', '🟣', '🟢', '💵', '💳', '📱', '⚡', '📲'];

  ngOnInit() {
    this.initYearsList();
    this.refreshAll();
  }

  private initYearsList() {
    const curYear = new Date().getFullYear();
    this.yearsList = [curYear - 2, curYear - 1, curYear, curYear + 1];
  }

  get upiMethodsList(): ExpensePaymentMethod[] {
    return this.paymentMethods.filter(m => m.type === 'upi' && m.status !== 'inactive');
  }

  setTab(tab: 'overview' | 'entries') {
    this.activeTab = tab;
    if (tab === 'overview') {
      this.loadOverview();
    }
  }

  setOverviewMode(mode: 'monthly' | 'yearly') {
    this.overviewMode = mode;
    this.loadOverview();
  }

  prevMonth() {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadOverview();
  }

  nextMonth() {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadOverview();
  }

  prevYear() {
    this.selectedYear--;
    this.loadOverview();
  }

  nextYear() {
    this.selectedYear++;
    this.loadOverview();
  }

  jumpToCurrentMonth() {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
    this.loadOverview();
  }

  jumpToCurrentYear() {
    this.selectedYear = new Date().getFullYear();
    this.loadOverview();
  }

  refreshAll() {
    this.loading = true;
    this.loadTags();
    this.loadPaymentMethods();
    this.loadExpenses();
    this.loadOverview();
  }

  loadOverview() {
    this.api.getExpenseOverview(this.overviewMode, this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        if (res.success) {
          this.overview = res.data;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load overview:', err);
      }
    });
  }

  loadTags() {
    this.api.getExpenseTags().subscribe({
      next: (res) => {
        if (res.success) {
          this.tags = res.data;
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load tags:', err)
    });
  }

  loadPaymentMethods() {
    this.api.getExpensePaymentMethods().subscribe({
      next: (res) => {
        if (res.success) {
          this.paymentMethods = res.data;
          // Set default payment method in form if unset
          if (!this.expenseFormData.payment_method_id) {
            const def = this.paymentMethods.find(m => m.is_default && m.type === 'upi') || this.paymentMethods.find(m => m.type === 'upi');
            if (def) {
              this.expenseFormData.payment_method_id = def.id;
              this.expenseFormData.payment_app_name = def.name;
            }
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load payment methods:', err)
    });
  }

  loadExpenses() {
    this.api.getExpenses().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.expenses = res.data;
          this.applyFilters();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.showError('Failed to load expenses list');
      }
    });
  }

  applyFilters() {
    let result = [...this.expenses];

    // Search Query
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.tag_name && e.tag_name.toLowerCase().includes(q)) ||
        (e.method_name && e.method_name.toLowerCase().includes(q)) ||
        (e.payment_app_name && e.payment_app_name.toLowerCase().includes(q))
      );
    }

    // Tag Filter
    if (this.filterTagId && this.filterTagId !== 'all') {
      const tagId = parseInt(this.filterTagId, 10);
      result = result.filter(e => e.tag_id === tagId);
    }

    // Payment Type Filter
    if (this.filterPaymentType && this.filterPaymentType !== 'all') {
      result = result.filter(e => e.payment_type === this.filterPaymentType);
    }

    // Payment Method / App Filter
    if (this.filterMethodId && this.filterMethodId !== 'all') {
      const methodId = parseInt(this.filterMethodId, 10);
      result = result.filter(e => e.payment_method_id === methodId);
    }

    this.filteredExpenses = result;
    this.totalFilteredAmount = result.reduce((acc, curr) => acc + (parseFloat(curr.amount as any) || 0), 0);
  }

  resetFilters() {
    this.searchQuery = '';
    this.filterTagId = 'all';
    this.filterPaymentType = 'all';
    this.filterMethodId = 'all';
    this.applyFilters();
  }

  filterByDate(dateStr: string) {
    this.activeTab = 'entries';
    this.searchQuery = '';
    this.filterTagId = 'all';
    this.filterPaymentType = 'all';
    this.filterMethodId = 'all';
    this.filteredExpenses = this.expenses.filter(e => e.expense_date === dateStr);
    this.totalFilteredAmount = this.filteredExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount as any) || 0), 0);
  }

  getYearlyBarHeight(amount: number): number {
    if (!this.overview || !this.overview.highestMonth || this.overview.highestMonth.amount === 0) {
      return 5;
    }
    const pct = (amount / this.overview.highestMonth.amount) * 100;
    return Math.max(pct, 5);
  }

  // ==========================================
  // EXPENSE MODAL ACTIONS
  // ==========================================

  openAddExpenseModal() {
    this.isEditingExpense = false;
    this.editingExpenseId = null;

    // Find default UPI method
    const def = this.paymentMethods.find(m => m.is_default && m.type === 'upi') || this.paymentMethods.find(m => m.type === 'upi');

    this.expenseFormData = {
      title: '',
      amount: null,
      expense_date: new Date().toISOString().slice(0, 10),
      tag_id: this.tags.length > 0 ? this.tags[0].id : null,
      payment_type: 'upi',
      payment_method_id: def ? def.id : null,
      payment_app_name: def ? def.name : '',
      notes: ''
    };
    this.showExpenseModal = true;
  }

  openEditExpenseModal(exp: DailyExpense) {
    this.isEditingExpense = true;
    this.editingExpenseId = exp.id;
    this.expenseFormData = {
      title: exp.title,
      amount: exp.amount,
      expense_date: exp.expense_date,
      tag_id: exp.tag_id || null,
      payment_type: exp.payment_type || 'upi',
      payment_method_id: exp.payment_method_id || null,
      payment_app_name: exp.payment_app_name || exp.method_name || '',
      notes: exp.notes || ''
    };
    this.showExpenseModal = true;
  }

  closeExpenseModal() {
    this.showExpenseModal = false;
  }

  applyPreset(preset: { title: string; icon: string; tagKeyword: string }) {
    this.expenseFormData.title = preset.title;
    // Auto-match tag
    const matched = this.tags.find(t => t.name.toLowerCase().includes(preset.tagKeyword.toLowerCase()));
    if (matched) {
      this.expenseFormData.tag_id = matched.id;
    }
  }

  selectUpiApp(app: ExpensePaymentMethod) {
    this.expenseFormData.payment_method_id = app.id;
    this.expenseFormData.payment_app_name = app.name;
  }

  saveExpense() {
    if (!this.expenseFormData.title || !this.expenseFormData.title.trim()) {
      this.showError('Please enter a description or title for this expense.');
      return;
    }
    if (!this.expenseFormData.amount || this.expenseFormData.amount <= 0) {
      this.showError('Please enter a valid amount.');
      return;
    }

    this.savingExpense = true;
    const payload = {
      title: this.expenseFormData.title.trim(),
      amount: this.expenseFormData.amount,
      expense_date: this.expenseFormData.expense_date,
      tag_id: this.expenseFormData.tag_id,
      payment_type: this.expenseFormData.payment_type,
      payment_method_id: this.expenseFormData.payment_type === 'upi' ? this.expenseFormData.payment_method_id : null,
      payment_app_name: this.expenseFormData.payment_type === 'upi' ? this.expenseFormData.payment_app_name : 'Cash',
      notes: this.expenseFormData.notes ? this.expenseFormData.notes.trim() : ''
    };

    if (this.isEditingExpense && this.editingExpenseId) {
      this.api.updateExpense(this.editingExpenseId, payload).subscribe({
        next: (res) => {
          this.savingExpense = false;
          this.closeExpenseModal();
          this.showSuccess('Expense updated successfully');
          this.loadExpenses();
          this.loadOverview();
        },
        error: (err) => {
          this.savingExpense = false;
          this.showError(err.error?.error || 'Failed to update expense');
        }
      });
    } else {
      this.api.createExpense(payload).subscribe({
        next: (res) => {
          this.savingExpense = false;
          this.closeExpenseModal();
          this.showSuccess('Expense recorded successfully');
          this.loadExpenses();
          this.loadOverview();
        },
        error: (err) => {
          this.savingExpense = false;
          this.showError(err.error?.error || 'Failed to add expense');
        }
      });
    }
  }

  deleteExpense(exp: DailyExpense) {
    if (!confirm(`Are you sure you want to delete the expense "${exp.title}" of ₹${exp.amount}?`)) {
      return;
    }

    this.api.deleteExpense(exp.id).subscribe({
      next: (res) => {
        this.showSuccess('Expense deleted');
        this.loadExpenses();
        this.loadOverview();
      },
      error: (err) => this.showError(err.error?.error || 'Failed to delete expense')
    });
  }

  // ==========================================
  // 🏷️ MANAGE TAGS MODAL
  // ==========================================

  openManageTagsModal() {
    this.resetTagForm();
    this.showTagsModal = true;
  }

  closeManageTagsModal() {
    this.showTagsModal = false;
    this.loadTags();
    this.loadOverview();
  }

  resetTagForm() {
    this.isEditingTag = false;
    this.editingTagId = null;
    this.tagFormData = {
      name: '',
      color: '#0284c7',
      icon: '🏷️'
    };
  }

  startEditTag(tag: ExpenseTag) {
    this.isEditingTag = true;
    this.editingTagId = tag.id;
    this.tagFormData = {
      name: tag.name,
      color: tag.color,
      icon: tag.icon
    };
  }

  saveTag() {
    if (!this.tagFormData.name || !this.tagFormData.name.trim()) {
      this.showError('Tag name is required.');
      return;
    }

    const payload = {
      name: this.tagFormData.name.trim(),
      color: this.tagFormData.color,
      icon: this.tagFormData.icon
    };

    if (this.isEditingTag && this.editingTagId) {
      this.api.updateExpenseTag(this.editingTagId, payload).subscribe({
        next: () => {
          this.showSuccess('Tag updated successfully');
          this.resetTagForm();
          this.loadTags();
          this.loadExpenses();
        },
        error: (err) => this.showError(err.error?.error || 'Failed to update tag')
      });
    } else {
      this.api.createExpenseTag(payload).subscribe({
        next: () => {
          this.showSuccess('Tag added successfully');
          this.resetTagForm();
          this.loadTags();
        },
        error: (err) => this.showError(err.error?.error || 'Failed to add tag')
      });
    }
  }

  deleteTag(tag: ExpenseTag) {
    if (!confirm(`Delete tag "${tag.name}"? Expenses with this tag will be marked Uncategorized.`)) {
      return;
    }
    this.api.deleteExpenseTag(tag.id).subscribe({
      next: () => {
        this.showSuccess('Tag deleted');
        this.loadTags();
        this.loadExpenses();
        this.loadOverview();
      },
      error: (err) => this.showError(err.error?.error || 'Failed to delete tag')
    });
  }

  // ==========================================
  // 📱 MANAGE PAYMENT METHODS / UPI APPS MODAL
  // ==========================================

  openManageMethodsModal() {
    this.resetMethodForm();
    this.showMethodsModal = true;
  }

  closeManageMethodsModal() {
    this.showMethodsModal = false;
    this.loadPaymentMethods();
    this.loadOverview();
  }

  resetMethodForm() {
    this.isEditingMethod = false;
    this.editingMethodId = null;
    this.methodFormData = {
      type: 'upi',
      name: '',
      icon: '📱',
      is_default: false
    };
  }

  startEditMethod(method: ExpensePaymentMethod) {
    this.isEditingMethod = true;
    this.editingMethodId = method.id;
    this.methodFormData = {
      type: method.type,
      name: method.name,
      icon: method.icon,
      is_default: method.is_default
    };
  }

  saveMethod() {
    if (!this.methodFormData.name || !this.methodFormData.name.trim()) {
      this.showError('Payment app or method name is required.');
      return;
    }

    const payload = {
      type: this.methodFormData.type,
      name: this.methodFormData.name.trim(),
      icon: this.methodFormData.icon,
      is_default: this.methodFormData.is_default
    };

    if (this.isEditingMethod && this.editingMethodId) {
      this.api.updateExpensePaymentMethod(this.editingMethodId, payload).subscribe({
        next: () => {
          this.showSuccess('Payment method updated');
          this.resetMethodForm();
          this.loadPaymentMethods();
          this.loadExpenses();
        },
        error: (err) => this.showError(err.error?.error || 'Failed to update payment method')
      });
    } else {
      this.api.createExpensePaymentMethod(payload).subscribe({
        next: () => {
          this.showSuccess('Payment method added');
          this.resetMethodForm();
          this.loadPaymentMethods();
        },
        error: (err) => this.showError(err.error?.error || 'Failed to add payment method')
      });
    }
  }

  deleteMethod(method: ExpensePaymentMethod) {
    if (!confirm(`Delete payment method "${method.name}"?`)) {
      return;
    }
    this.api.deleteExpensePaymentMethod(method.id).subscribe({
      next: () => {
        this.showSuccess('Payment method deleted');
        this.loadPaymentMethods();
        this.loadExpenses();
        this.loadOverview();
      },
      error: (err) => this.showError(err.error?.error || 'Failed to delete payment method')
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private showSuccess(msg: string) {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.markForCheck();
    }, 5000);
  }
}
