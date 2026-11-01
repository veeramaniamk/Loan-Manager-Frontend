import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { 
  CateringService, 
  CateringMember, 
  CateringServiceStaff, 
  CateringStaffPayment, 
  CateringSummary 
} from '../../core/models/loan.model';

@Component({
  selector: 'app-catering',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="container catering-container">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">🍽️ Catering Services & Events</h1>
          <p class="page-subtitle">Manage catering bookings, staff attendance, shift salaries & payment histories</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAddServiceModal()">
            <span>➕ New Catering Service</span>
          </button>
          <button class="btn btn-secondary" (click)="openMembersModal()">
            <span>👥 Staff Roster</span>
          </button>
          <button class="btn btn-secondary" (click)="openAllLogsModal()">
            <span>📜 Payment Logs</span>
          </button>
          <button class="btn btn-secondary" (click)="loadAllData()" [disabled]="loading">
            <span>🔄 Refresh</span>
          </button>
        </div>
      </div>

      <!-- Alert / Messages -->
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

      <!-- KPI Summary Metrics Grid -->
      @if (summary) {
        <div class="metrics-grid">
          <!-- Upcoming Amount & Bookings -->
          <div class="metric-card metric-upcoming">
            <div class="metric-header">
              <span class="metric-icon">📋</span>
              <span class="metric-label">Upcoming Orders</span>
            </div>
            <div class="metric-value text-primary">
              {{ summary.totalUpcomingAmount | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="metric-footer">
              <strong>{{ summary.upcomingServices }}</strong> upcoming catering events
            </div>
          </div>

          <!-- Customer Pending Amount -->
          <div class="metric-card metric-pending">
            <div class="metric-header">
              <span class="metric-icon">💰</span>
              <span class="metric-label">Pending from Clients</span>
            </div>
            <div class="metric-value text-warning">
              {{ summary.totalPendingCustomerAmount | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="metric-footer">
              Advance collected: {{ summary.totalAdvanceReceived | currency:'INR':'symbol':'1.0-0' }}
            </div>
          </div>

          <!-- Total Staff Salary Obligation -->
          <div class="metric-card metric-wages">
            <div class="metric-header">
              <span class="metric-icon">👥</span>
              <span class="metric-label">Staff Wages Cost</span>
            </div>
            <div class="metric-value text-danger">
              {{ summary.totalStaffSalaryObligation | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="metric-footer">
              Rate: ₹300 / service session (1=300, 2=600, 3=900)
            </div>
          </div>

          <!-- Pending Staff Wages to Pay -->
          <div class="metric-card metric-paid">
            <div class="metric-header">
              <span class="metric-icon">💸</span>
              <span class="metric-label">Pending Staff Wages</span>
            </div>
            <div class="metric-value text-success">
              {{ summary.pendingStaffSalaryToPay | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="metric-footer">
              Already paid: {{ summary.totalStaffSalaryPaid | currency:'INR':'symbol':'1.0-0' }}
            </div>
          </div>
        </div>
      }

      <!-- Filters & Search Toolbar -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div class="filter-item search-item">
            <label class="form-label">Search Services</label>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search by event, customer, venue or notes..." 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="applyFilters()"
            />
          </div>

          <div class="filter-item">
            <label class="form-label">Status</label>
            <select class="form-control" [(ngModel)]="filterStatus" (change)="applyFilters()">
              <option value="">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Services List -->
      @if (loading && services.length === 0) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading catering services & staff schedules...</p>
        </div>
      } @else if (services.length === 0) {
        <div class="card empty-card">
          <span class="empty-icon">🍽️</span>
          <h3>No catering services found</h3>
          <p class="text-muted">Start by booking a new catering service or event.</p>
          <button class="btn btn-primary btn-sm" (click)="openAddServiceModal()">Add First Service</button>
        </div>
      } @else {
        <div class="services-list">
          @for (service of services; track service.id) {
            <div class="card service-card" [class.card-completed]="service.status === 'completed'">
              <!-- Service Main Info Header -->
              <div class="service-card-header">
                <div class="service-meta">
                  <div class="service-title-row">
                    <h2 class="service-title">{{ service.service_name }}</h2>
                    <span class="badge" [ngClass]="getStatusBadgeClass(service.status)">
                      {{ service.status }}
                    </span>
                  </div>

                  <div class="service-sub-row">
                    <span class="service-date">
                      📅 <strong>{{ service.service_date | date:'EEE, dd MMM yyyy' }}</strong>
                    </span>

                    @if (service.customer_name) {
                      <span class="service-customer">
                        👤 {{ service.customer_name }}
                        @if (service.customer_phone) {
                          • <a [href]="'tel:' + service.customer_phone" class="phone-link">📞 {{ service.customer_phone }}</a>
                        }
                      </span>
                    }
                  </div>
                </div>

                <div class="service-header-actions">
                  <button class="btn btn-sm btn-secondary" (click)="openEditServiceModal(service)" title="Edit Service">
                    ✏️ Edit
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="deleteService(service)" title="Delete Service">
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Sessions & Venue Info Strip -->
              <div class="service-location-strip">
                <div class="venue-info">
                  <span class="venue-location">📍 <strong>{{ service.location }}</strong></span>
                  <a [href]="getMapUrl(service)" target="_blank" rel="noopener noreferrer" class="map-link-btn" title="Open location in Google Maps">
                    🗺️ Open in Google Maps ↗
                  </a>
                </div>

                <!-- Session Badges -->
                <div class="session-badges">
                  <span class="session-label">Shifts:</span>
                  @for (sess of service.sessions; track sess) {
                    <span class="badge session-badge" [ngClass]="'badge-' + sess">
                      {{ getSessionLabel(sess) }}
                    </span>
                  }
                </div>
              </div>

              <!-- Optional Remarks -->
              @if (service.remarks) {
                <div class="service-remarks">
                  <span>💬 <em>{{ service.remarks }}</em></span>
                </div>
              }

              <!-- Service Financials Strip -->
              <div class="service-financials">
                <div class="fin-col">
                  <span class="fin-label">Total Contract Amount</span>
                  <span class="fin-val text-primary">{{ service.total_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="fin-col">
                  <span class="fin-label">Advance Received</span>
                  <span class="fin-val text-success">{{ service.advance_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="fin-col">
                  <span class="fin-label">Pending from Client</span>
                  <span class="fin-val text-warning">{{ service.pending_amount | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="fin-col">
                  <span class="fin-label">Total Staff Wages</span>
                  <span class="fin-val text-danger">{{ (service.total_staff_salary || 0) | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
              </div>

              <!-- Staff Accordion Bar -->
              <div class="staff-accordion-bar">
                <div class="staff-count-summary">
                  <span class="staff-count-badge">
                    👥 <strong>{{ service.staff_count || 0 }}</strong> Staff Members Assigned
                  </span>
                  <span class="staff-wage-summary text-muted">
                    Paid: {{ (service.total_staff_paid || 0) | currency:'INR':'symbol':'1.0-0' }} | 
                    Pending: {{ ((service.total_staff_salary || 0) - (service.total_staff_paid || 0)) | currency:'INR':'symbol':'1.0-0' }}
                  </span>
                </div>

                <div class="accordion-buttons">
                  <button class="btn btn-sm btn-secondary" (click)="openAssignStaffModal(service)">
                    ➕ Add Member
                  </button>
                  <button class="btn btn-sm" [ngClass]="service.isExpanded ? 'btn-primary' : 'btn-secondary'" (click)="toggleExpand(service)">
                    <span>{{ service.isExpanded ? '▲ Hide Staff List' : '▼ View Staff List (' + (service.staff_count || 0) + ')' }}</span>
                  </button>
                </div>
              </div>

              <!-- EXPANDED STAFF MEMBERS LIST (The key requirement) -->
              @if (service.isExpanded) {
                <div class="expanded-staff-section">
                  <div class="section-title-row">
                    <h4>Staff Members Attendance & Wages</h4>
                    <span class="salary-rule-tag">💡 ₹300 per session worked (1 shift = ₹300, 2 shifts = ₹600, 3 shifts = ₹900)</span>
                  </div>

                  @if (!service.staff_list || service.staff_list.length === 0) {
                    <div class="empty-staff-box">
                      <p class="text-muted">No staff members assigned to this service yet.</p>
                      <button class="btn btn-primary btn-sm" (click)="openAssignStaffModal(service)">Assign First Member</button>
                    </div>
                  } @else {
                    <!-- Desktop Table -->
                    <div class="table-container desktop-only">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>Member Name</th>
                            <th>Contact</th>
                            <th>Sessions / Shifts Worked</th>
                            <th>Total Shifts</th>
                            <th>Calculated Salary</th>
                            <th>Paid Status</th>
                            <th style="text-align: right;">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (staff of service.staff_list; track staff.id) {
                            <tr>
                              <td>
                                <strong>{{ staff.name }}</strong>
                                <span class="member-role text-muted">({{ staff.role || 'Staff' }})</span>
                              </td>
                              <td>
                                <a [href]="'tel:' + staff.phone" class="phone-link">📞 {{ staff.phone || 'No phone' }}</a>
                              </td>
                              <td>
                                <div class="shift-tags">
                                  @if (staff.worked_morning) {
                                    <span class="shift-tag shift-morning">🌅 Morning</span>
                                  }
                                  @if (staff.worked_afternoon) {
                                    <span class="shift-tag shift-afternoon">☀️ Afternoon</span>
                                  }
                                  @if (staff.worked_night) {
                                    <span class="shift-tag shift-night">🌙 Night</span>
                                  }
                                </div>
                              </td>
                              <td>
                                <span class="badge badge-secondary">{{ staff.session_count }} Shift(s)</span>
                              </td>
                              <td>
                                <strong class="salary-amount">{{ staff.total_salary | currency:'INR':'symbol':'1.0-0' }}</strong>
                              </td>
                              <td>
                                <span class="badge" [ngClass]="staff.paid_status === 'paid' ? 'badge-success' : 'badge-danger'">
                                  {{ staff.paid_status === 'paid' ? '✅ Paid' : '⏳ Pending' }}
                                </span>
                                @if (staff.paid_status === 'partially_paid') {
                                  <span class="text-muted text-xs">(Paid: ₹{{ staff.paid_amount }})</span>
                                }
                              </td>
                              <td style="text-align: right;">
                                <div class="row-actions">
                                  @if (staff.paid_status !== 'paid') {
                                    <button class="btn btn-success btn-sm" (click)="openPayStaffModal(service, staff)">
                                      💵 Pay / Mark Paid
                                    </button>
                                  } @else {
                                    <button class="btn btn-secondary btn-sm" (click)="viewStaffHistory(staff)">
                                      📜 Receipt
                                    </button>
                                  }
                                  <button class="btn btn-secondary btn-sm" (click)="openEditStaffModal(service, staff)" title="Edit Shifts">
                                    ✏️
                                  </button>
                                  <button class="btn btn-danger btn-sm" (click)="removeStaff(service, staff)" title="Remove Member">
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>

                    <!-- Mobile Cards View for Android Phone -->
                    <div class="mobile-staff-cards mobile-only">
                      @for (staff of service.staff_list; track staff.id) {
                        <div class="mobile-staff-card" [class.staff-paid]="staff.paid_status === 'paid'">
                          <div class="mobile-staff-top">
                            <div>
                              <strong class="mobile-staff-name">{{ staff.name }}</strong>
                              <span class="text-muted text-xs">({{ staff.role || 'Staff' }})</span>
                            </div>
                            <span class="badge" [ngClass]="staff.paid_status === 'paid' ? 'badge-success' : 'badge-danger'">
                              {{ staff.paid_status === 'paid' ? '✅ Paid' : '⏳ Pending' }}
                            </span>
                          </div>

                          <div class="mobile-staff-phone">
                            <a [href]="'tel:' + staff.phone" class="phone-link">📞 {{ staff.phone }}</a>
                          </div>

                          <div class="mobile-staff-shifts">
                            <span class="text-muted text-xs">Shifts:</span>
                            @if (staff.worked_morning) { <span class="shift-tag shift-morning">🌅 Morning</span> }
                            @if (staff.worked_afternoon) { <span class="shift-tag shift-afternoon">☀️ Afternoon</span> }
                            @if (staff.worked_night) { <span class="shift-tag shift-night">🌙 Night</span> }
                            <span class="badge badge-secondary text-xs">{{ staff.session_count }} session(s)</span>
                          </div>

                          <div class="mobile-staff-salary-row">
                            <span class="salary-lbl">Salary (₹300/session):</span>
                            <strong class="salary-val">{{ staff.total_salary | currency:'INR':'symbol':'1.0-0' }}</strong>
                          </div>

                          <div class="mobile-staff-actions">
                            @if (staff.paid_status !== 'paid') {
                              <button class="btn btn-success btn-sm flex-1" (click)="openPayStaffModal(service, staff)">
                                💵 Pay / Mark Paid
                              </button>
                            } @else {
                              <button class="btn btn-secondary btn-sm flex-1" (click)="viewStaffHistory(staff)">
                                📜 Payment Log
                              </button>
                            }
                            <button class="btn btn-secondary btn-sm" (click)="openEditStaffModal(service, staff)" title="Edit Shifts">
                              ✏️
                            </button>
                            <button class="btn btn-danger btn-sm" (click)="removeStaff(service, staff)" title="Remove Member">
                              ✕
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- MODAL 1: Create / Edit Catering Service -->
      @if (showServiceModal) {
        <div class="modal-overlay" (click)="closeServiceModal()">
          <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingServiceId ? 'Edit Catering Service' : '➕ New Catering Service' }}</h3>
              <button class="btn btn-sm btn-secondary" (click)="closeServiceModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (modalError) {
                <div class="alert alert-danger">{{ modalError }}</div>
              }

              <div class="form-group">
                <label class="form-label">Service / Event Name *</label>
                <input type="text" class="form-control" [(ngModel)]="serviceForm.service_name" placeholder="e.g. Anand & Divya Wedding Lunch" required />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Client / Customer Name</label>
                  <input type="text" class="form-control" [(ngModel)]="serviceForm.customer_name" placeholder="e.g. Suresh Kumar" />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Customer Phone</label>
                  <input type="text" class="form-control" [(ngModel)]="serviceForm.customer_phone" placeholder="e.g. +91 9876543210" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Event Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="serviceForm.service_date" required />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Status</label>
                  <select class="form-control" [(ngModel)]="serviceForm.status">
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <!-- Sessions / Shifts Checkboxes -->
              <div class="form-group">
                <label class="form-label">Service Sessions / Shifts (Select all that apply) *</label>
                <div class="shift-checkboxes">
                  <label class="shift-box" [class.checked]="isSessionSelected('morning')">
                    <input type="checkbox" [checked]="isSessionSelected('morning')" (change)="toggleSession('morning')" />
                    <span>🌅 Morning (Breakfast / Lunch)</span>
                  </label>
                  <label class="shift-box" [class.checked]="isSessionSelected('afternoon')">
                    <input type="checkbox" [checked]="isSessionSelected('afternoon')" (change)="toggleSession('afternoon')" />
                    <span>☀️ Afternoon (Lunch / Tea)</span>
                  </label>
                  <label class="shift-box" [class.checked]="isSessionSelected('night')">
                    <input type="checkbox" [checked]="isSessionSelected('night')" (change)="toggleSession('night')" />
                    <span>🌙 Night (Dinner / Reception)</span>
                  </label>
                </div>
              </div>

              <!-- Venue Location & Map Link -->
              <div class="form-group">
                <div class="label-with-action">
                  <label class="form-label">Venue Location *</label>
                  <button type="button" class="btn btn-sm btn-secondary loc-btn" (click)="detectCurrentLocation()" [disabled]="detectingLocation">
                    <span>{{ detectingLocation ? '📍 Detecting...' : '📍 Use Current Location' }}</span>
                  </button>
                </div>
                <input type="text" class="form-control" [(ngModel)]="serviceForm.location" placeholder="e.g. Kovai Mahal, Trichy Road, Coimbatore" required />
              </div>

              <div class="form-group">
                <label class="form-label">Google Maps Link (Optional URL)</label>
                <input type="text" class="form-control" [(ngModel)]="serviceForm.map_link" placeholder="https://maps.google.com/?q=..." />
                <span class="text-muted text-xs">If left blank, a Google Maps search link will be auto-generated from the venue address.</span>
              </div>

              <!-- Financials -->
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Total Contract Amount (₹)</label>
                  <input type="number" class="form-control" [(ngModel)]="serviceForm.total_amount" placeholder="e.g. 45000" />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Advance Received (₹)</label>
                  <input type="number" class="form-control" [(ngModel)]="serviceForm.advance_amount" placeholder="e.g. 15000" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Remarks / Menu / Guest Notes</label>
                <textarea class="form-control" [(ngModel)]="serviceForm.remarks" placeholder="e.g. 400 guests, 3 live counters, sweet: Rasamalai"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeServiceModal()">Cancel</button>
              <button class="btn btn-primary" (click)="saveService()" [disabled]="savingService">
                {{ savingService ? 'Saving...' : 'Save Catering Service' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: Assign Staff Member to Service -->
      @if (showAssignStaffModal && activeServiceForStaff) {
        <div class="modal-overlay" (click)="closeAssignStaffModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>➕ Assign Staff to: {{ activeServiceForStaff.service_name }}</h3>
              <button class="btn btn-sm btn-secondary" (click)="closeAssignStaffModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (staffModalError) {
                <div class="alert alert-danger">{{ staffModalError }}</div>
              }

              <!-- Member Select Mode -->
              <div class="form-group">
                <div class="member-mode-tabs">
                  <button 
                    type="button" 
                    class="tab-btn" 
                    [class.active]="staffSelectMode === 'existing'"
                    (click)="staffSelectMode = 'existing'"
                  >
                    Select from Staff Roster
                  </button>
                  <button 
                    type="button" 
                    class="tab-btn" 
                    [class.active]="staffSelectMode === 'new'"
                    (click)="staffSelectMode = 'new'"
                  >
                    + Add New Staff Member
                  </button>
                </div>

                @if (staffSelectMode === 'existing') {
                  <select class="form-control" [(ngModel)]="assignStaffForm.member_id">
                    <option [ngValue]="null">-- Choose from staff roster --</option>
                    @for (m of staffMembers; track m.id) {
                      <option [ngValue]="m.id">{{ m.name }} ({{ m.phone }}) - {{ m.role }}</option>
                    }
                  </select>
                } @else {
                  <div class="sub-form">
                    <input type="text" class="form-control mb-2" placeholder="Full Name *" [(ngModel)]="newMemberForm.name" />
                    <input type="text" class="form-control mb-2" placeholder="Phone Number *" [(ngModel)]="newMemberForm.phone" />
                    <input type="text" class="form-control" placeholder="Role (e.g. Server, Chef)" [(ngModel)]="newMemberForm.role" />
                  </div>
                }
              </div>

              <!-- Shifts worked -->
              <div class="form-group">
                <label class="form-label">Shifts Worked in This Service *</label>
                <div class="shift-checkboxes">
                  <label class="shift-box" [class.checked]="assignStaffForm.worked_morning">
                    <input type="checkbox" [(ngModel)]="assignStaffForm.worked_morning" />
                    <span>🌅 Morning (₹300)</span>
                  </label>
                  <label class="shift-box" [class.checked]="assignStaffForm.worked_afternoon">
                    <input type="checkbox" [(ngModel)]="assignStaffForm.worked_afternoon" />
                    <span>☀️ Afternoon (₹300)</span>
                  </label>
                  <label class="shift-box" [class.checked]="assignStaffForm.worked_night">
                    <input type="checkbox" [(ngModel)]="assignStaffForm.worked_night" />
                    <span>🌙 Night (₹300)</span>
                  </label>
                </div>
              </div>

              <!-- Live Salary Calculator Display -->
              <div class="salary-calc-box">
                <div class="calc-row">
                  <span>Calculated Shifts:</span>
                  <strong>{{ calculateSelectedShifts() }} Shift(s)</strong>
                </div>
                <div class="calc-row">
                  <span>Rate:</span>
                  <span>₹300 per session</span>
                </div>
                <div class="calc-row total-calc-row">
                  <span>Total Payable Salary:</span>
                  <strong class="text-success text-lg">{{ (calculateSelectedShifts() * 300) | currency:'INR':'symbol':'1.0-0' }}</strong>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Remarks / Role Assignment</label>
                <input type="text" class="form-control" [(ngModel)]="assignStaffForm.remarks" placeholder="e.g. VIP Buffet in charge" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeAssignStaffModal()">Cancel</button>
              <button class="btn btn-primary" (click)="saveAssignStaff()" [disabled]="savingStaff">
                {{ savingStaff ? 'Assigning...' : 'Confirm Assignment' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: Pay / Mark Staff Salary as Paid -->
      @if (showPayModal && activeStaffForPayment && activeServiceForPayment) {
        <div class="modal-overlay" (click)="closePayModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>💵 Record Staff Salary Payment</h3>
              <button class="btn btn-sm btn-secondary" (click)="closePayModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="pay-summary-banner">
                <div class="pay-banner-row">
                  <span>Staff Member:</span>
                  <strong>{{ activeStaffForPayment.name }} ({{ activeStaffForPayment.phone }})</strong>
                </div>
                <div class="pay-banner-row">
                  <span>Catering Event:</span>
                  <span>{{ activeServiceForPayment.service_name }}</span>
                </div>
                <div class="pay-banner-row">
                  <span>Shifts Worked:</span>
                  <span>{{ activeStaffForPayment.session_count }} session(s)</span>
                </div>
                <div class="pay-banner-row">
                  <span>Total Salary:</span>
                  <strong class="text-primary">{{ activeStaffForPayment.total_salary | currency:'INR':'symbol':'1.0-0' }}</strong>
                </div>
                <div class="pay-banner-row highlight">
                  <span>Remaining Pending:</span>
                  <strong class="text-danger">{{ activeStaffForPayment.pending_salary | currency:'INR':'symbol':'1.0-0' }}</strong>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Amount to Pay (₹) *</label>
                <input type="number" class="form-control" [(ngModel)]="payAmount" required />
              </div>

              <div class="form-group">
                <label class="form-label">Payment Date *</label>
                <input type="date" class="form-control" [(ngModel)]="payDate" required />
              </div>

              <div class="form-group">
                <label class="form-label">Payment Mode *</label>
                <select class="form-control" [(ngModel)]="payMethod">
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="cash">Cash (Direct in Hand)</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Notes / Remarks</label>
                <input type="text" class="form-control" [(ngModel)]="payNotes" placeholder="e.g. Paid morning shift salary via GPay" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closePayModal()">Cancel</button>
              <button class="btn btn-success" (click)="submitStaffPayment()" [disabled]="submittingPay">
                {{ submittingPay ? 'Recording...' : 'Mark as Paid & Save Log' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 4: Staff Roster Management -->
      @if (showMembersModal) {
        <div class="modal-overlay" (click)="closeMembersModal()">
          <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>👥 Catering Staff Roster & Balances</h3>
              <button class="btn btn-sm btn-secondary" (click)="closeMembersModal()">✕</button>
            </div>
            <div class="modal-body">
              <!-- Add new member form -->
              <div class="card p-3 mb-3 bg-light">
                <h4 class="mb-2">Add New Worker to Roster</h4>
                <div class="form-row">
                  <div class="flex-1">
                    <input type="text" class="form-control" placeholder="Name *" [(ngModel)]="newRosterMember.name" />
                  </div>
                  <div class="flex-1">
                    <input type="text" class="form-control" placeholder="Phone *" [(ngModel)]="newRosterMember.phone" />
                  </div>
                  <div class="flex-1">
                    <input type="text" class="form-control" placeholder="Role (e.g. Server, Cook)" [(ngModel)]="newRosterMember.role" />
                  </div>
                  <button class="btn btn-primary" (click)="saveNewRosterMember()">Add</button>
                </div>
              </div>

              <!-- Members Table -->
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Role</th>
                      <th>Events Worked</th>
                      <th>Earned</th>
                      <th>Paid</th>
                      <th>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of staffMembers; track m.id) {
                      <tr>
                        <td><strong>{{ m.name }}</strong></td>
                        <td><a [href]="'tel:' + m.phone" class="phone-link">📞 {{ m.phone }}</a></td>
                        <td><span class="badge badge-secondary">{{ m.role }}</span></td>
                        <td>{{ m.total_services_worked || 0 }} events</td>
                        <td><strong class="text-primary">{{ (m.total_salary_earned || 0) | currency:'INR':'symbol':'1.0-0' }}</strong></td>
                        <td><strong class="text-success">{{ (m.total_salary_paid || 0) | currency:'INR':'symbol':'1.0-0' }}</strong></td>
                        <td><strong [ngClass]="(m.pending_balance || 0) > 0 ? 'text-danger' : 'text-muted'">{{ (m.pending_balance || 0) | currency:'INR':'symbol':'1.0-0' }}</strong></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeMembersModal()">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 5: Salary Payment Log History -->
      @if (showLogsModal) {
        <div class="modal-overlay" (click)="closeLogsModal()">
          <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>📜 Staff Salary Payment History Logs</h3>
              <button class="btn btn-sm btn-secondary" (click)="closeLogsModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (paymentLogs.length === 0) {
                <p class="text-muted text-center py-4">No staff payments recorded yet.</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Staff Member</th>
                        <th>Catering Event</th>
                        <th>Amount Paid</th>
                        <th>Mode</th>
                        <th>Notes / Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (log of paymentLogs; track log.id) {
                        <tr>
                          <td>{{ log.payment_date | date:'dd MMM yyyy' }}</td>
                          <td>
                            <strong>{{ log.member_name }}</strong>
                            <span class="text-muted text-xs d-block">{{ log.member_phone }}</span>
                          </td>
                          <td>
                            <span>{{ log.service_name || 'Direct Payout' }}</span>
                          </td>
                          <td>
                            <strong class="text-success">{{ log.amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                          </td>
                          <td>
                            <span class="badge badge-secondary">{{ log.payment_method }}</span>
                          </td>
                          <td>
                            <span class="text-muted">{{ log.notes || 'No remarks' }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeLogsModal()">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .catering-container {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    @media (max-width: 768px) {
      .catering-container {
        padding-top: 1rem;
        padding-bottom: 1.5rem;
      }
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
    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    @media (max-width: 640px) {
      .page-header {
        margin-bottom: 1rem;
        gap: 0.75rem;
      }
      .page-title {
        font-size: 1.45rem;
      }
      .page-subtitle {
        font-size: 0.825rem;
      }
      .header-actions {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .header-actions .btn {
        width: 100%;
        font-size: 0.8rem;
        padding: 0.55rem 0.5rem;
      }
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 640px) {
      .metrics-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
    }
    @media (max-width: 380px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
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
    .metric-upcoming::before { background: #3b82f6; }
    .metric-pending::before { background: #f59e0b; }
    .metric-wages::before { background: #ef4444; }
    .metric-paid::before { background: #10b981; }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
    }
    .metric-icon {
      font-size: 1.2rem;
    }
    .metric-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-value {
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 0.35rem;
    }
    @media (max-width: 640px) {
      .metric-card {
        padding: 0.85rem;
      }
      .metric-value {
        font-size: 1.35rem;
      }
      .metric-footer {
        font-size: 0.68rem;
      }
    }
    .metric-footer {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: auto;
    }

    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: 3fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .filter-card {
        padding: 0.85rem;
        margin-bottom: 1rem;
      }
      .filter-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }
    }

    /* Services List */
    .services-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .service-card {
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      gap: 1rem;
      transition: all 0.2s ease;
      border-left: 4px solid var(--primary);
    }
    .service-card.card-completed {
      border-left-color: var(--success);
      opacity: 0.95;
    }
    @media (max-width: 640px) {
      .service-card {
        padding: 0.85rem;
        gap: 0.75rem;
      }
    }
    .service-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .service-meta {
      flex: 1;
    }
    .service-title-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
      margin-bottom: 0.25rem;
    }
    .service-title {
      font-size: 1.2rem;
      color: #0f172a;
      line-height: 1.2;
    }
    .service-sub-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      flex-wrap: wrap;
    }
    .service-header-actions {
      display: flex;
      gap: 0.35rem;
    }

    .service-location-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 0.65rem;
    }
    .venue-info {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
      font-size: 0.85rem;
    }
    .map-link-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      background: #eef2ff;
      color: var(--primary);
      border-radius: var(--radius-full);
      font-size: 0.725rem;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.15s;
    }
    .map-link-btn:hover {
      background: #e0e7ff;
      text-decoration: underline;
    }
    .session-badges {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .session-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .session-badge {
      font-size: 0.7rem;
    }
    .badge-morning { background: #fef3c7; color: #92400e; }
    .badge-afternoon { background: #fed7aa; color: #9a3412; }
    .badge-night { background: #e0e7ff; color: #3730a3; }

    .service-remarks {
      font-size: 0.8rem;
      color: #475569;
      background: #fffbeb;
      padding: 0.4rem 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px dashed #fde68a;
    }

    .service-financials {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      background: #ffffff;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }
    @media (max-width: 640px) {
      .service-financials {
        grid-template-columns: 1fr 1fr;
      }
    }
    .fin-col {
      display: flex;
      flex-direction: column;
    }
    .fin-label {
      font-size: 0.68rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }
    .fin-val {
      font-size: 1.05rem;
      font-weight: 800;
    }

    /* Staff Accordion Bar */
    .staff-accordion-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0.85rem;
      background: #f1f5f9;
      border-radius: var(--radius-md);
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .staff-count-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .staff-count-badge {
      font-size: 0.85rem;
      color: #0f172a;
    }
    .staff-wage-summary {
      font-size: 0.8rem;
    }
    .accordion-buttons {
      display: flex;
      gap: 0.4rem;
    }

    /* Expanded Staff Section */
    .expanded-staff-section {
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      animation: fadeIn 0.2s ease-out;
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .salary-rule-tag {
      font-size: 0.725rem;
      color: #047857;
      background: #ecfdf5;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-full);
      font-weight: 600;
    }
    .empty-staff-box {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-muted);
      background: #ffffff;
      border-radius: var(--radius-sm);
    }

    .shift-tags {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .shift-tag {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
    }
    .shift-morning { background: #fef3c7; color: #92400e; }
    .shift-afternoon { background: #fed7aa; color: #9a3412; }
    .shift-night { background: #e0e7ff; color: #3730a3; }

    .salary-amount {
      font-size: 1.05rem;
      color: #0f172a;
    }

    .phone-link {
      color: var(--primary);
      text-decoration: underline;
      font-size: 0.825rem;
    }

    /* Mobile Staff Cards */
    .mobile-staff-cards {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .mobile-staff-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .mobile-staff-card.staff-paid {
      border-left: 3px solid #10b981;
    }
    .mobile-staff-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .mobile-staff-name {
      font-size: 0.95rem;
    }
    .mobile-staff-shifts {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .mobile-staff-salary-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.4rem 0.5rem;
      background: #f8fafc;
      border-radius: 4px;
    }
    .salary-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .salary-val {
      font-size: 1.05rem;
      color: #0f172a;
    }
    .mobile-staff-actions {
      display: flex;
      gap: 0.4rem;
      margin-top: 0.25rem;
    }

    /* Shift Checkboxes in Modals */
    .shift-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .shift-box {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.6rem 0.85rem;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s ease;
    }
    .shift-box.checked {
      background: #eef2ff;
      border-color: var(--primary);
      font-weight: 600;
    }

    /* Live Salary Calculator Box */
    .salary-calc-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
      margin-bottom: 0.25rem;
    }
    .total-calc-row {
      font-size: 0.95rem;
      border-top: 1px dashed #6ee7b7;
      padding-top: 0.35rem;
      margin-top: 0.35rem;
      margin-bottom: 0;
    }

    /* Pay Summary Banner */
    .pay-summary-banner {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem;
      margin-bottom: 1.25rem;
    }
    .pay-banner-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
      margin-bottom: 0.3rem;
    }
    .pay-banner-row.highlight {
      font-size: 0.95rem;
      font-weight: 700;
      border-top: 1px solid var(--border-color);
      padding-top: 0.35rem;
      margin-top: 0.35rem;
      margin-bottom: 0;
    }

    .member-mode-tabs {
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
    .mb-3 { margin-bottom: 0.75rem; }
    .p-3 { padding: 0.75rem; }
    .bg-light { background: #f8fafc; }
    .text-xs { font-size: 0.725rem; }
    .text-lg { font-size: 1.15rem; }
    .d-block { display: block; }
    .flex-1 { flex: 1; }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .form-row {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
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
      max-width: 780px;
    }
    .row-actions {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
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
export class CateringComponent implements OnInit {
  apiService = inject(ApiService);
  cdr = inject(ChangeDetectorRef);

  services: CateringService[] = [];
  staffMembers: CateringMember[] = [];
  paymentLogs: CateringStaffPayment[] = [];
  summary: CateringSummary | null = null;
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Filter params
  searchQuery = '';
  filterStatus = '';

  // Modal 1: Add / Edit Service
  showServiceModal = false;
  editingServiceId: number | null = null;
  savingService = false;
  detectingLocation = false;
  modalError = '';
  serviceForm = {
    service_name: '',
    customer_name: '',
    customer_phone: '',
    service_date: new Date().toISOString().slice(0, 10),
    sessions: ['morning'] as string[],
    location: '',
    map_link: '',
    total_amount: 0,
    advance_amount: 0,
    status: 'upcoming' as 'upcoming' | 'completed' | 'cancelled',
    remarks: ''
  };

  // Modal 2: Assign Staff
  showAssignStaffModal = false;
  activeServiceForStaff: CateringService | null = null;
  staffSelectMode: 'existing' | 'new' = 'existing';
  savingStaff = false;
  staffModalError = '';
  assignStaffForm = {
    member_id: null as number | null,
    worked_morning: true,
    worked_afternoon: false,
    worked_night: false,
    rate_per_session: 300,
    remarks: ''
  };
  newMemberForm = {
    name: '',
    phone: '',
    role: 'Server',
    notes: ''
  };

  // Modal 3: Pay Staff
  showPayModal = false;
  activeStaffForPayment: CateringServiceStaff | null = null;
  activeServiceForPayment: CateringService | null = null;
  submittingPay = false;
  payAmount = 0;
  payDate = new Date().toISOString().slice(0, 10);
  payMethod = 'upi';
  payNotes = '';

  // Modal 4: Staff Roster
  showMembersModal = false;
  newRosterMember = {
    name: '',
    phone: '',
    role: 'Server'
  };

  // Modal 5: Logs
  showLogsModal = false;

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.apiService.getCateringSummary().subscribe({
      next: (res) => {
        if (res.success) {
          this.summary = res.data;
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });

    this.loadServices();
    this.loadMembers();
  }

  loadServices() {
    this.apiService.getCateringServices({
      status: this.filterStatus,
      search: this.searchQuery
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          // Preserve expanded states if already toggled
          const expandedMap = new Map(this.services.map(s => [s.id, s.isExpanded]));
          this.services = res.data.map(s => ({
            ...s,
            isExpanded: expandedMap.get(s.id) ?? false
          }));
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to load catering services.';
        this.cdr.markForCheck();
      }
    });
  }

  loadMembers() {
    this.apiService.getCateringMembers().subscribe({
      next: (res) => {
        if (res.success) {
          this.staffMembers = res.data;
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });
  }

  applyFilters() {
    this.loadServices();
  }

  toggleExpand(service: CateringService) {
    service.isExpanded = !service.isExpanded;
    this.cdr.markForCheck();
  }

  getMapUrl(service: CateringService): string {
    if (service.map_link && service.map_link.trim().startsWith('http')) {
      return service.map_link.trim();
    }
    return `https://maps.google.com/?q=${encodeURIComponent(service.location || 'Coimbatore')}`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-primary';
    }
  }

  getSessionLabel(session: string): string {
    switch (session) {
      case 'morning': return '🌅 Morning';
      case 'afternoon': return '☀️ Afternoon';
      case 'night': return '🌙 Night';
      default: return session;
    }
  }

  // --- Modal 1: Service Add / Edit ---
  openAddServiceModal() {
    this.editingServiceId = null;
    this.modalError = '';
    this.serviceForm = {
      service_name: '',
      customer_name: '',
      customer_phone: '',
      service_date: new Date().toISOString().slice(0, 10),
      sessions: ['morning'],
      location: '',
      map_link: '',
      total_amount: 0,
      advance_amount: 0,
      status: 'upcoming',
      remarks: ''
    };
    this.showServiceModal = true;
    this.cdr.markForCheck();
  }

  openEditServiceModal(service: CateringService) {
    this.editingServiceId = service.id;
    this.modalError = '';
    this.serviceForm = {
      service_name: service.service_name,
      customer_name: service.customer_name || '',
      customer_phone: service.customer_phone || '',
      service_date: service.service_date ? service.service_date.slice(0, 10) : '',
      sessions: [...service.sessions],
      location: service.location,
      map_link: service.map_link || '',
      total_amount: service.total_amount,
      advance_amount: service.advance_amount,
      status: service.status,
      remarks: service.remarks || ''
    };
    this.showServiceModal = true;
    this.cdr.markForCheck();
  }

  closeServiceModal() {
    this.showServiceModal = false;
    this.cdr.markForCheck();
  }

  isSessionSelected(session: string): boolean {
    return this.serviceForm.sessions.includes(session);
  }

  toggleSession(session: string) {
    if (this.isSessionSelected(session)) {
      if (this.serviceForm.sessions.length > 1) {
        this.serviceForm.sessions = this.serviceForm.sessions.filter(s => s !== session);
      }
    } else {
      this.serviceForm.sessions.push(session);
    }
    this.cdr.markForCheck();
  }

  detectCurrentLocation() {
    if (!navigator.geolocation) {
      this.modalError = 'Geolocation is not supported by your browser.';
      this.cdr.markForCheck();
      return;
    }

    this.detectingLocation = true;
    this.cdr.markForCheck();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        this.serviceForm.location = `Location (${lat}, ${lng})`;
        this.serviceForm.map_link = `https://maps.google.com/?q=${lat},${lng}`;
        this.detectingLocation = false;
        this.cdr.markForCheck();
      },
      () => {
        this.detectingLocation = false;
        this.modalError = 'Could not access GPS. Please type the venue address manually.';
        this.cdr.markForCheck();
      },
      { timeout: 7000 }
    );
  }

  saveService() {
    this.modalError = '';
    if (!this.serviceForm.service_name || !this.serviceForm.service_date || !this.serviceForm.location) {
      this.modalError = 'Please enter service name, date, and venue location.';
      this.cdr.markForCheck();
      return;
    }

    this.savingService = true;
    this.cdr.markForCheck();

    if (this.editingServiceId) {
      this.apiService.updateCateringService(this.editingServiceId, this.serviceForm).subscribe({
        next: () => {
          this.savingService = false;
          this.showServiceModal = false;
          this.showNotification('Catering service updated successfully');
          this.loadAllData();
        },
        error: (err) => {
          this.savingService = false;
          this.modalError = err.error?.error || 'Failed to update service';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.apiService.createCateringService(this.serviceForm).subscribe({
        next: () => {
          this.savingService = false;
          this.showServiceModal = false;
          this.showNotification('Catering service order created successfully');
          this.loadAllData();
        },
        error: (err) => {
          this.savingService = false;
          this.modalError = err.error?.error || 'Failed to create service';
          this.cdr.markForCheck();
        }
      });
    }
  }

  deleteService(service: CateringService) {
    if (!confirm(`Are you sure you want to delete "${service.service_name}"? All assigned staff records for this event will also be removed.`)) {
      return;
    }

    this.apiService.deleteCateringService(service.id).subscribe({
      next: () => {
        this.showNotification('Service deleted successfully');
        this.loadAllData();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to delete service';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Modal 2: Assign Staff ---
  openAssignStaffModal(service: CateringService) {
    this.activeServiceForStaff = service;
    this.staffModalError = '';
    this.staffSelectMode = 'existing';
    this.assignStaffForm = {
      member_id: this.staffMembers.length > 0 ? this.staffMembers[0].id : null,
      worked_morning: service.sessions.includes('morning'),
      worked_afternoon: service.sessions.includes('afternoon'),
      worked_night: service.sessions.includes('night'),
      rate_per_session: 300,
      remarks: ''
    };
    this.newMemberForm = { name: '', phone: '', role: 'Server', notes: '' };
    this.showAssignStaffModal = true;
    this.cdr.markForCheck();
  }

  openEditStaffModal(service: CateringService, staff: CateringServiceStaff) {
    this.activeServiceForStaff = service;
    this.staffModalError = '';
    this.staffSelectMode = 'existing';
    this.assignStaffForm = {
      member_id: staff.member_id,
      worked_morning: staff.worked_morning,
      worked_afternoon: staff.worked_afternoon,
      worked_night: staff.worked_night,
      rate_per_session: 300,
      remarks: staff.remarks || ''
    };
    this.showAssignStaffModal = true;
    this.cdr.markForCheck();
  }

  closeAssignStaffModal() {
    this.showAssignStaffModal = false;
    this.activeServiceForStaff = null;
    this.cdr.markForCheck();
  }

  calculateSelectedShifts(): number {
    let count = (this.assignStaffForm.worked_morning ? 1 : 0) + 
                (this.assignStaffForm.worked_afternoon ? 1 : 0) + 
                (this.assignStaffForm.worked_night ? 1 : 0);
    return count === 0 ? 1 : count;
  }

  saveAssignStaff() {
    if (!this.activeServiceForStaff) return;
    this.staffModalError = '';

    const payload: any = {
      worked_morning: this.assignStaffForm.worked_morning,
      worked_afternoon: this.assignStaffForm.worked_afternoon,
      worked_night: this.assignStaffForm.worked_night,
      rate_per_session: 300,
      remarks: this.assignStaffForm.remarks
    };

    if (this.staffSelectMode === 'existing') {
      if (!this.assignStaffForm.member_id) {
        this.staffModalError = 'Please select a staff member from the roster.';
        this.cdr.markForCheck();
        return;
      }
      payload.member_id = this.assignStaffForm.member_id;
    } else {
      if (!this.newMemberForm.name || !this.newMemberForm.phone) {
        this.staffModalError = 'Please enter new member name and phone.';
        this.cdr.markForCheck();
        return;
      }
      payload.new_member = this.newMemberForm;
    }

    this.savingStaff = true;
    this.cdr.markForCheck();

    this.apiService.addCateringStaff(this.activeServiceForStaff.id, payload).subscribe({
      next: (res) => {
        this.savingStaff = false;
        this.showAssignStaffModal = false;
        this.showNotification(res.message);
        this.loadAllData();
      },
      error: (err) => {
        this.savingStaff = false;
        this.staffModalError = err.error?.error || 'Failed to assign staff member';
        this.cdr.markForCheck();
      }
    });
  }

  removeStaff(service: CateringService, staff: CateringServiceStaff) {
    if (!confirm(`Remove "${staff.name}" from this service?`)) return;

    this.apiService.removeCateringStaff(service.id, staff.id).subscribe({
      next: () => {
        this.showNotification(`Removed ${staff.name} from service`);
        this.loadAllData();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to remove staff';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Modal 3: Pay Staff ---
  openPayStaffModal(service: CateringService, staff: CateringServiceStaff) {
    this.activeServiceForPayment = service;
    this.activeStaffForPayment = staff;
    this.payAmount = staff.pending_salary > 0 ? staff.pending_salary : staff.total_salary;
    this.payDate = new Date().toISOString().slice(0, 10);
    this.payMethod = 'upi';
    this.payNotes = `Salary paid for ${staff.name} (${staff.session_count} shift(s) at ${service.service_name})`;
    this.showPayModal = true;
    this.cdr.markForCheck();
  }

  closePayModal() {
    this.showPayModal = false;
    this.activeStaffForPayment = null;
    this.activeServiceForPayment = null;
    this.cdr.markForCheck();
  }

  submitStaffPayment() {
    if (!this.activeServiceForPayment || !this.activeStaffForPayment) return;
    if (this.payAmount <= 0) {
      alert('Please enter a valid payment amount greater than zero');
      return;
    }

    this.submittingPay = true;
    this.cdr.markForCheck();

    this.apiService.payCateringStaff(
      this.activeServiceForPayment.id,
      this.activeStaffForPayment.id,
      {
        amount: this.payAmount,
        payment_date: this.payDate,
        payment_method: this.payMethod,
        notes: this.payNotes
      }
    ).subscribe({
      next: (res) => {
        this.submittingPay = false;
        this.showPayModal = false;
        this.showNotification(res.message);
        this.loadAllData();
      },
      error: (err) => {
        this.submittingPay = false;
        alert(err.error?.error || 'Failed to record staff payment');
        this.cdr.markForCheck();
      }
    });
  }

  viewStaffHistory(staff: CateringServiceStaff) {
    this.apiService.getCateringPaymentLogs({ member_id: staff.member_id }).subscribe({
      next: (res) => {
        if (res.success) {
          this.paymentLogs = res.data;
          this.showLogsModal = true;
          this.cdr.markForCheck();
        }
      }
    });
  }

  // --- Modal 4: Members Roster ---
  openMembersModal() {
    this.newRosterMember = { name: '', phone: '', role: 'Server' };
    this.loadMembers();
    this.showMembersModal = true;
    this.cdr.markForCheck();
  }

  closeMembersModal() {
    this.showMembersModal = false;
    this.cdr.markForCheck();
  }

  saveNewRosterMember() {
    if (!this.newRosterMember.name || !this.newRosterMember.phone) {
      alert('Please enter both name and phone number');
      return;
    }

    this.apiService.createCateringMember(this.newRosterMember).subscribe({
      next: () => {
        this.newRosterMember = { name: '', phone: '', role: 'Server' };
        this.loadMembers();
        this.showNotification('Staff member added to roster');
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to add staff member');
      }
    });
  }

  // --- Modal 5: Logs ---
  openAllLogsModal() {
    this.apiService.getCateringPaymentLogs().subscribe({
      next: (res) => {
        if (res.success) {
          this.paymentLogs = res.data;
          this.showLogsModal = true;
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });
  }

  closeLogsModal() {
    this.showLogsModal = false;
    this.cdr.markForCheck();
  }

  showNotification(msg: string) {
    this.successMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }
}
