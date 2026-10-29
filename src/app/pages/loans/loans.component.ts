import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Loan, Person, LoanPayment } from '../../core/models/loan.model';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="container loans-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Loans & Debt Ledger</h1>
          <p class="page-subtitle">Track, filter, and settle all money given and taken</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span>➕ Add New Loan Record</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div class="filter-item search-item">
            <label class="form-label">Search</label>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search by person, notes, or location..." 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="applyFilters()"
            />
          </div>

          <div class="filter-item">
            <label class="form-label">Type</label>
            <select class="form-control" [(ngModel)]="filterType" (change)="applyFilters()">
              <option value="">All Types</option>
              <option value="given">Money Given (Receivable)</option>
              <option value="taken">Money Taken (Payable)</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="form-label">Status</label>
            <select class="form-control" [(ngModel)]="filterStatus" (change)="applyFilters()">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="settled">Settled / Closed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="form-label">Location</label>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Filter location" 
              [(ngModel)]="filterLocation" 
              (ngModelChange)="applyFilters()"
            />
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading loan records...</p>
        </div>
      } @else if (loans.length === 0) {
        <div class="card empty-card">
          <span class="empty-icon">📁</span>
          <h3>No loans found</h3>
          <p class="text-muted">No loans match your current search criteria. Try clearing filters or create a new loan record.</p>
          <button class="btn btn-primary btn-sm" (click)="openAddModal()">Add First Loan</button>
        </div>
      } @else {
        <!-- Loans Table -->
        <div class="card loans-table-card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Direction</th>
                  <th>Principal Amount</th>
                  <th>Remaining</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (loan of loans; track loan.id) {
                  <tr>
                    <td>
                      <div class="person-cell">
                        <strong class="person-name">{{ loan.person_name }}</strong>
                        <span class="person-phone text-muted">{{ loan.person_phone || 'No phone' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="loan.type === 'given' ? 'badge-success' : 'badge-danger'">
                        {{ loan.type === 'given' ? '📥 I Lent (Receivable)' : '📤 I Borrowed (Payable)' }}
                      </span>
                    </td>
                    <td>
                      <strong>{{ loan.principal_amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                      @if (loan.interest_rate > 0) {
                        <span class="text-muted interest-rate">({{ loan.interest_rate }}% Int)</span>
                      }
                    </td>
                    <td>
                      <strong [ngClass]="loan.remaining_balance === 0 ? 'text-muted' : (loan.type === 'given' ? 'text-success' : 'text-danger')">
                        {{ loan.remaining_balance | currency:'INR':'symbol':'1.0-0' }}
                      </strong>
                    </td>
                    <td>{{ loan.issue_date | date:'dd MMM yyyy' }}</td>
                    <td>
                      @if (loan.due_date) {
                        <span [ngClass]="{'text-danger font-bold': loan.is_overdue, 'text-warning font-bold': loan.is_due_today}">
                          {{ loan.due_date | date:'dd MMM yyyy' }}
                        </span>
                      } @else {
                        <span class="text-muted">Not specified</span>
                      }
                    </td>
                    <td>
                      <span class="loc-badge">📍 {{ loan.location || 'Unspecified' }}</span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadgeClass(loan.status)">
                        {{ loan.status }}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div class="row-actions">
                        <button class="btn btn-secondary btn-sm" (click)="openLedgerModal(loan)">
                          Ledger / Pay
                        </button>
                        <button class="btn btn-danger btn-sm" (click)="deleteLoan(loan)">
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
      }

      <!-- Add Loan Modal -->
      @if (showAddModal) {
        <div class="modal-overlay" (click)="closeAddModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>➕ Add New Loan Record</h3>
              <button class="btn btn-sm btn-secondary" (click)="closeAddModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (modalError) {
                <div class="alert alert-danger">{{ modalError }}</div>
              }

              <!-- Loan Type Toggle -->
              <div class="form-group">
                <label class="form-label">Transaction Type</label>
                <div class="type-selector">
                  <button 
                    type="button" 
                    class="type-btn" 
                    [class.active-given]="newLoan.type === 'given'"
                    (click)="newLoan.type = 'given'"
                  >
                    📥 Money Given (I lent money)
                  </button>
                  <button 
                    type="button" 
                    class="type-btn" 
                    [class.active-taken]="newLoan.type === 'taken'"
                    (click)="newLoan.type = 'taken'"
                  >
                    📤 Money Taken (I borrowed money)
                  </button>
                </div>
              </div>

              <!-- Person Selection -->
              <div class="form-group">
                <div class="person-mode-tabs">
                  <button 
                    type="button" 
                    class="tab-btn" 
                    [class.active]="personSelectionMode === 'existing'"
                    (click)="personSelectionMode = 'existing'"
                  >
                    Select Existing Person
                  </button>
                  <button 
                    type="button" 
                    class="tab-btn" 
                    [class.active]="personSelectionMode === 'new'"
                    (click)="personSelectionMode = 'new'"
                  >
                    + Create New Contact
                  </button>
                </div>

                @if (personSelectionMode === 'existing') {
                  <select class="form-control" [(ngModel)]="newLoan.person_id">
                    <option [ngValue]="null">-- Choose from your contacts --</option>
                    @for (p of existingPeople; track p.id) {
                      <option [ngValue]="p.id">{{ p.name }} ({{ p.location || 'No location' }})</option>
                    }
                  </select>
                } @else {
                  <div class="sub-form">
                    <input 
                      type="text" 
                      class="form-control mb-2" 
                      placeholder="Person's Full Name" 
                      [(ngModel)]="newLoan.person_name" 
                    />
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="Phone Number (e.g. +91 9876543210)" 
                      [(ngModel)]="newLoan.person_phone" 
                    />
                  </div>
                }
              </div>

              <!-- Principal Amount & Interest Rate -->
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Principal Amount (₹) *</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    placeholder="e.g. 25000" 
                    [(ngModel)]="newLoan.principal_amount" 
                    required 
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Interest % (Optional)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    placeholder="0" 
                    [(ngModel)]="newLoan.interest_rate" 
                  />
                </div>
              </div>

              <!-- Dates -->
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Issue Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="newLoan.issue_date" />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Due Date (Optional)</label>
                  <input type="date" class="form-control" [(ngModel)]="newLoan.due_date" />
                </div>
              </div>

              <!-- Location with Current Location Auto-Detect -->
              <div class="form-group">
                <div class="label-with-action">
                  <label class="form-label">Location (City / Area / Place)</label>
                  <button type="button" class="btn btn-sm btn-secondary loc-btn" (click)="detectCurrentLocation()" [disabled]="detectingLocation">
                    <span>{{ detectingLocation ? '📍 Detecting...' : '📍 Use Current Location' }}</span>
                  </button>
                </div>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="e.g. Chennai, T. Nagar" 
                  [(ngModel)]="newLoan.location" 
                />
              </div>

              <!-- Notes -->
              <div class="form-group">
                <label class="form-label">Purpose / Notes</label>
                <textarea 
                  class="form-control" 
                  placeholder="e.g. Emergency medical expenses lent, agreed to return in two installments" 
                  [(ngModel)]="newLoan.notes"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeAddModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitCreateLoan()" [disabled]="savingLoan">
                {{ savingLoan ? 'Saving...' : 'Save Loan Record' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Loan Ledger & Payment Modal -->
      @if (selectedLoanForLedger) {
        <div class="modal-overlay" (click)="closeLedgerModal()">
          <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3>Loan Ledger: {{ selectedLoanForLedger.person_name }}</h3>
                <span class="badge" [ngClass]="selectedLoanForLedger.type === 'given' ? 'badge-success' : 'badge-danger'">
                  {{ selectedLoanForLedger.type === 'given' ? 'Receivable (Money Lent)' : 'Payable (Money Borrowed)' }}
                </span>
              </div>
              <button class="btn btn-sm btn-secondary" (click)="closeLedgerModal()">✕</button>
            </div>
            <div class="modal-body">
              <!-- Summary Strip -->
              <div class="ledger-summary">
                <div class="summary-col">
                  <span class="lbl">Principal:</span>
                  <span class="val">{{ selectedLoanForLedger.principal_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="summary-col">
                  <span class="lbl">Total Paid:</span>
                  <span class="val text-success">{{ selectedLoanForLedger.total_paid | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="summary-col">
                  <span class="lbl">Remaining Balance:</span>
                  <span class="val text-danger">{{ selectedLoanForLedger.remaining_balance | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="summary-col">
                  <span class="lbl">Location:</span>
                  <span class="val">📍 {{ selectedLoanForLedger.location || 'N/A' }}</span>
                </div>
              </div>

              <!-- Add Payment Form -->
              @if ((selectedLoanForLedger.remaining_balance ?? 0) > 0) {
                <div class="record-pay-box">
                  <h4 class="box-title">
                    {{ selectedLoanForLedger.type === 'given' ? '📥 Record Collection' : '📤 Record Repayment' }}
                  </h4>
                  <div class="pay-inputs">
                    <input 
                      type="number" 
                      class="form-control" 
                      placeholder="Amount (₹)" 
                      [(ngModel)]="ledgerPaymentAmount" 
                    />
                    <input type="date" class="form-control" [(ngModel)]="ledgerPaymentDate" />
                    <select class="form-control" [(ngModel)]="ledgerPaymentMethod">
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / GPay</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="Remarks" 
                      [(ngModel)]="ledgerPaymentNotes" 
                    />
                    <button class="btn btn-success" (click)="submitLedgerPayment()" [disabled]="submittingLedgerPayment">
                      {{ submittingLedgerPayment ? 'Adding...' : 'Add Payment' }}
                    </button>
                  </div>
                </div>
              } @else {
                <div class="alert alert-success">
                  🎉 This loan is completely settled and closed!
                </div>
              }

              <!-- Payment History Ledger -->
              <h4 class="history-title">Transaction & Installment History</h4>
              @if (!selectedLoanForLedger.payments || selectedLoanForLedger.payments.length === 0) {
                <p class="text-muted text-center py-3">No payments recorded yet for this loan.</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Amount Paid</th>
                        <th>Remarks</th>
                        <th style="text-align: right;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (pay of selectedLoanForLedger.payments; track pay.id) {
                        <tr>
                          <td>{{ pay.payment_date | date:'dd MMM yyyy' }}</td>
                          <td>
                            <span class="badge badge-secondary">{{ pay.payment_method }}</span>
                          </td>
                          <td>
                            <strong class="text-success">{{ pay.amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                          </td>
                          <td>{{ pay.notes || '-' }}</td>
                          <td style="text-align: right;">
                            <button class="btn btn-sm btn-danger" (click)="deletePayment(pay.id)">
                              Delete
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeLedgerModal()">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .loans-container {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 1.85rem;
    }
    .page-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 800px) {
      .filter-grid {
        grid-template-columns: 1fr;
      }
    }
    .loans-table-card {
      padding: 0;
      overflow: hidden;
    }
    .person-cell {
      display: flex;
      flex-direction: column;
    }
    .person-name {
      font-weight: 700;
    }
    .person-phone {
      font-size: 0.775rem;
    }
    .interest-rate {
      font-size: 0.75rem;
      margin-left: 0.25rem;
    }
    .loc-badge {
      font-size: 0.8rem;
      color: #475569;
    }
    .row-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    .type-selector {
      display: flex;
      gap: 0.75rem;
    }
    .type-btn {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      background: #ffffff;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }
    .type-btn.active-given {
      border-color: #10b981;
      background: #ecfdf5;
      color: #065f46;
    }
    .type-btn.active-taken {
      border-color: #f43f5e;
      background: #fff1f2;
      color: #9f1239;
    }
    .person-mode-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .tab-btn {
      background: none;
      border: none;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-bottom: 2px solid transparent;
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .sub-form {
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .mb-2 { margin-bottom: 0.5rem; }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .flex-1 { flex: 1; }
    .label-with-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .loc-btn {
      font-size: 0.725rem;
      padding: 0.2rem 0.5rem;
    }
    .modal-lg {
      max-width: 720px;
    }
    .ledger-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
    }
    .summary-col {
      display: flex;
      flex-direction: column;
    }
    .summary-col .lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }
    .summary-col .val {
      font-size: 1.1rem;
      font-weight: 800;
    }
    .record-pay-box {
      padding: 1.25rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
    }
    .box-title {
      font-size: 0.95rem;
      color: #166534;
      margin-bottom: 0.75rem;
    }
    .pay-inputs {
      display: grid;
      grid-template-columns: 1.5fr 1.5fr 1.5fr 2fr auto;
      gap: 0.5rem;
      align-items: center;
    }
    @media (max-width: 768px) {
      .pay-inputs {
        grid-template-columns: 1fr;
      }
      .ledger-summary {
        grid-template-columns: 1fr 1fr;
      }
    }
    .history-title {
      font-size: 1rem;
      margin-bottom: 0.75rem;
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
    .font-bold {
      font-weight: 700;
    }
  `]
})
export class LoansComponent implements OnInit {
  apiService = inject(ApiService);

  loans: Loan[] = [];
  existingPeople: Person[] = [];
  loading = true;

  // Filter params
  searchQuery = '';
  filterType = '';
  filterStatus = '';
  filterLocation = '';

  // Add Loan Modal state
  showAddModal = false;
  personSelectionMode: 'existing' | 'new' = 'existing';
  newLoan: any = {
    type: 'given',
    person_id: null,
    person_name: '',
    person_phone: '',
    principal_amount: null,
    interest_rate: 0,
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    location: '',
    notes: ''
  };
  detectingLocation = false;
  savingLoan = false;
  modalError = '';

  // Ledger Modal state
  selectedLoanForLedger: Loan | null = null;
  ledgerPaymentAmount: number | null = null;
  ledgerPaymentDate: string = new Date().toISOString().slice(0, 10);
  ledgerPaymentMethod: string = 'upi';
  ledgerPaymentNotes: string = '';
  submittingLedgerPayment = false;

  ngOnInit() {
    this.loadLoans();
    this.loadPeople();
  }

  loadLoans() {
    this.loading = true;
    this.apiService.getLoans({
      search: this.searchQuery,
      type: this.filterType,
      status: this.filterStatus,
      location: this.filterLocation
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.loans = res.data;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching loans:', err);
      }
    });
  }

  loadPeople() {
    this.apiService.getPeople().subscribe({
      next: (res) => {
        if (res.success) {
          this.existingPeople = res.data;
        }
      }
    });
  }

  applyFilters() {
    this.loadLoans();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'settled': return 'badge-success';
      case 'partially_paid': return 'badge-info';
      case 'overdue': return 'badge-danger';
      default: return 'badge-warning';
    }
  }

  // Modal handlers
  openAddModal() {
    this.showAddModal = true;
    this.modalError = '';
    this.newLoan = {
      type: 'given',
      person_id: this.existingPeople.length > 0 ? this.existingPeople[0].id : null,
      person_name: '',
      person_phone: '',
      principal_amount: null,
      interest_rate: 0,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      location: '',
      notes: ''
    };
    this.personSelectionMode = this.existingPeople.length > 0 ? 'existing' : 'new';
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  detectCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.detectingLocation = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        // Set coordinates as location or fallback to readable string
        this.newLoan.location = `GPS: (${lat}, ${lng})`;
        this.detectingLocation = false;
      },
      (err) => {
        console.warn('Geolocation error:', err);
        this.newLoan.location = 'Current City / Location';
        this.detectingLocation = false;
      },
      { timeout: 7000 }
    );
  }

  submitCreateLoan() {
    if (!this.newLoan.principal_amount || this.newLoan.principal_amount <= 0) {
      this.modalError = 'Please specify a valid principal amount.';
      return;
    }

    if (this.personSelectionMode === 'new' && !this.newLoan.person_name?.trim()) {
      this.modalError = 'Please provide the person\'s name.';
      return;
    }

    if (this.personSelectionMode === 'existing' && !this.newLoan.person_id) {
      this.modalError = 'Please select a contact person.';
      return;
    }

    this.savingLoan = true;
    this.modalError = '';

    const payload: any = {
      type: this.newLoan.type,
      principal_amount: this.newLoan.principal_amount,
      interest_rate: this.newLoan.interest_rate || 0,
      issue_date: this.newLoan.issue_date,
      due_date: this.newLoan.due_date || null,
      location: this.newLoan.location,
      notes: this.newLoan.notes
    };

    if (this.personSelectionMode === 'existing') {
      payload.person_id = this.newLoan.person_id;
    } else {
      payload.person_name = this.newLoan.person_name;
      payload.person_phone = this.newLoan.person_phone;
    }

    this.apiService.createLoan(payload).subscribe({
      next: () => {
        this.savingLoan = false;
        this.closeAddModal();
        this.loadLoans();
        this.loadPeople();
      },
      error: (err) => {
        this.savingLoan = false;
        this.modalError = err.error?.error || 'Failed to create loan record.';
      }
    });
  }

  deleteLoan(loan: Loan) {
    if (confirm(`Are you sure you want to delete this loan of ₹${loan.principal_amount} for ${loan.person_name}?`)) {
      this.apiService.deleteLoan(loan.id).subscribe({
        next: () => this.loadLoans(),
        error: (err) => alert(err.error?.error || 'Failed to delete loan')
      });
    }
  }

  // Ledger / Payment Modal
  openLedgerModal(loan: Loan) {
    this.apiService.getLoanById(loan.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedLoanForLedger = res.data;
          this.ledgerPaymentAmount = Number(res.data.remaining_balance) || 0;
          this.ledgerPaymentDate = new Date().toISOString().slice(0, 10);
          this.ledgerPaymentMethod = 'upi';
          this.ledgerPaymentNotes = '';
        }
      }
    });
  }

  closeLedgerModal() {
    this.selectedLoanForLedger = null;
    this.loadLoans(); // refresh updated balance in main table
  }

  submitLedgerPayment() {
    if (!this.selectedLoanForLedger || !this.ledgerPaymentAmount || this.ledgerPaymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    this.submittingLedgerPayment = true;
    this.apiService.addLoanPayment(this.selectedLoanForLedger.id, {
      amount: this.ledgerPaymentAmount,
      payment_date: this.ledgerPaymentDate,
      payment_method: this.ledgerPaymentMethod,
      notes: this.ledgerPaymentNotes
    }).subscribe({
      next: () => {
        this.submittingLedgerPayment = false;
        // Re-fetch loan ledger
        this.openLedgerModal(this.selectedLoanForLedger!);
      },
      error: (err) => {
        this.submittingLedgerPayment = false;
        alert(err.error?.error || 'Failed to record payment');
      }
    });
  }

  deletePayment(paymentId: number) {
    if (!this.selectedLoanForLedger) return;
    if (confirm('Are you sure you want to delete this payment record? The loan remaining balance will be adjusted.')) {
      this.apiService.deleteLoanPayment(this.selectedLoanForLedger.id, paymentId).subscribe({
        next: () => {
          this.openLedgerModal(this.selectedLoanForLedger!);
        },
        error: (err) => alert(err.error?.error || 'Failed to delete payment')
      });
    }
  }
}
