import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { 
  SmsGatewayOverview, 
  SmsMessage, 
  SmsDevice, 
  SmsNotification, 
  SmsUserDeviceAccess, 
  SmsUser, 
  SmsUserSummary,
  SmsUserFcmToken, 
  SmsLog 
} from '../../core/models/loan.model';

@Component({
  selector: 'app-sms-gateway-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="sms-panel-container">
      <!-- Control Panel Header & Daemon Status -->
      <div class="panel-header-strip">
        <div class="header-left">
          <div class="header-title-row">
            <span class="telemetry-icon">📡</span>
            <div>
              <h2 class="panel-title">Dad's Phone & SMS Telemetry Hub</h2>
              <p class="panel-subtitle">
                Centralized telemetry command center for Dad's phone (Samsung Galaxy), live SMS ingestion, banking OTP extraction & push notifications
              </p>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="daemon-pill" title="Gateway Daemon & Socket Listener Active">
            <span class="live-pulse"></span>
            <span>Gateway Daemon Online</span>
          </div>
          <button class="btn btn-primary btn-sm" (click)="openSimulateModal()">
            <span>➕ Ingest / Test SMS</span>
          </button>
          <button class="btn btn-secondary btn-sm" (click)="refreshAll()" [disabled]="loading">
            <span>🔄 Refresh</span>
          </button>
        </div>
      </div>

      <!-- Messages / Feedback Alert -->
      @if (alertMessage) {
        <div class="alert" [ngClass]="alertType === 'success' ? 'alert-success' : 'alert-danger'">
          <span>{{ alertType === 'success' ? '✅' : '⚠️' }} {{ alertMessage }}</span>
        </div>
      }

      <!-- ======================================================== -->
      <!-- 1. 📧 STEP 1: SELECT MONITORED USER BY EMAIL -->
      <!-- ======================================================== -->
      <div class="user-selector-card">
        <div class="user-selector-header">
          <div class="d-flex align-items-center gap-2">
            <span class="step-indicator">Step 1</span>
            <div>
              <h3 class="user-selector-title">Select Monitored User Account by Email</h3>
              <p class="user-selector-desc">Select an account below to inspect its devices, live SMS stream, and permission controls (direct admin access)</p>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" (click)="openAddUserModal()">
            <span>➕ Add Monitored User</span>
          </button>
        </div>

        <!-- Quick Email Dropdown Selector -->
        <div class="email-dropdown-wrap mb-3">
          <label class="form-label-xs font-bold text-muted">🎯 Active Monitored Account Email:</label>
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <select 
              class="form-control email-select-input" 
              [(ngModel)]="selectedEmail" 
              (change)="selectUserByEmail(selectedEmail)">
              @for (u of smsUsers; track u.id) {
                <option [value]="u.email">
                  {{ getUserAvatar(u.user_type) }} {{ u.email }} — {{ u.name || 'User' }} ({{ formatUserType(u.user_type) }} • {{ u.total_messages_count || 0 }} Messages)
                </option>
              }
            </select>
            <button class="btn btn-secondary btn-sm" (click)="selectUserByEmail('alagappantk@gmail.com')">
              <span>👨‍🦳 Quick Select Appa (Dad)</span>
            </button>
          </div>
        </div>

        <!-- Interactive User Account Cards -->
        <div class="user-cards-grid">
          @for (u of smsUsers; track u.id) {
            <div 
              class="user-card" 
              [class.selected]="selectedEmail === u.email" 
              (click)="selectUserByEmail(u.email)"
              [title]="'Select ' + (u.name || u.email)">
              
              <div class="user-card-top">
                <div class="user-avatar-wrap">
                  <span class="user-avatar-icon">
                    {{ getUserAvatar(u.user_type) }}
                  </span>
                  @if (selectedEmail === u.email) {
                    <span class="selected-badge" title="Currently Active Account">✓</span>
                  }
                </div>
                <div class="user-identity">
                  <div class="user-name-row">
                    <strong class="user-name">{{ u.name || 'Unnamed User' }}</strong>
                    <span class="badge" [ngClass]="getUserTypeBadge(u.user_type)">
                      {{ formatUserType(u.user_type) }}
                    </span>
                  </div>
                  <span class="user-email">{{ u.email }}</span>
                </div>
              </div>

              <div class="user-card-stats">
                <div class="user-stat-chip">
                  <span class="chip-label">📱 Devices</span>
                  <span class="chip-val">{{ u.devices_count || 0 }}</span>
                </div>
                <div class="user-stat-chip">
                  <span class="chip-label">📩 Messages</span>
                  <span class="chip-val font-extrabold text-primary">{{ u.total_messages_count || 0 }}</span>
                </div>
                <div class="user-stat-chip">
                  <span class="chip-label">🔔 Push</span>
                  <span class="chip-val">{{ u.active_fcm_tokens || 0 }}</span>
                </div>
              </div>

              <div class="user-card-footer">
                @if ((u.unread_count || 0) > 0) {
                  <span class="badge badge-danger unread-alert-pill">
                    ● {{ u.unread_count }} Unread
                  </span>
                } @else {
                  <span class="text-xs text-muted">All read</span>
                }
                <span class="text-xs text-muted">
                  {{ u.last_active_at ? (u.last_active_at | date:'dd MMM, hh:mm a') : 'No recent sync' }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 2. ACTIVE USER FOCUS BANNER (WHEN USER IS SELECTED) -->
      <!-- ======================================================== -->
      @if (selectedUser) {
        <div class="active-user-ribbon fade-in">
          <div class="active-ribbon-left">
            <span class="ribbon-avatar">{{ getUserAvatar(selectedUser.user_type) }}</span>
            <div>
              <div class="ribbon-title-row">
                <span class="ribbon-tag">ACTIVE CONTEXT</span>
                <h3 class="ribbon-name">{{ selectedUser.name || selectedUser.email }}</h3>
                <span class="badge" [ngClass]="getUserTypeBadge(selectedUser.user_type)">
                  {{ formatUserType(selectedUser.user_type) }}
                </span>
              </div>
              <div class="ribbon-meta-row">
                <span>✉️ <strong>{{ selectedUser.email }}</strong></span>
                <span>•</span>
                <span>📱 <strong>{{ devices.length }}</strong> Devices</span>
                <span>•</span>
                <span>📩 <strong>{{ totalMessagesCount }}</strong> Total Messages</span>
                <span>•</span>
                <span class="text-warning">🔑 <strong>{{ recentOtpCount }}</strong> OTPs</span>
                @if (unreadMessagesCount > 0) {
                  <span class="badge badge-danger">
                    {{ unreadMessagesCount }} Unread
                  </span>
                }
              </div>
            </div>
          </div>

          <div class="active-ribbon-actions">
            <button class="btn btn-warning btn-sm" (click)="triggerSelectedUserSync()" title="Dispatch instant SMS sync push to all devices">
              <span>⚡ Trigger Phone Sync</span>
            </button>
            <button class="btn btn-primary btn-sm" (click)="openAddDeviceModal()" title="Add device for this user">
              <span>📲 Add Device</span>
            </button>
            <button class="btn btn-outline btn-sm" (click)="openSimulateModal()" title="Ingest SMS for this user">
              <span>📩 Ingest SMS</span>
            </button>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- 3. SUB-NAVIGATION TABS (SCOPED TO SELECTED USER) -->
        <!-- ======================================================== -->
        <div class="sub-nav-bar">
          <button 
            class="sub-nav-btn" 
            [class.active]="activeSubTab === 'messages'" 
            (click)="switchSubTab('messages')">
            <span>📩 Live SMS & OTPs</span>
            <span class="count-pill">{{ totalMessagesCount }}</span>
          </button>
          <button 
            class="sub-nav-btn" 
            [class.active]="activeSubTab === 'devices'" 
            (click)="switchSubTab('devices')">
            <span>📲 Monitored Devices</span>
            <span class="count-pill">{{ devices.length }}</span>
          </button>
          <button 
            class="sub-nav-btn" 
            [class.active]="activeSubTab === 'access'" 
            (click)="switchSubTab('access')">
            <span>🔐 Access Matrix & Sharing</span>
            <span class="count-pill">{{ accessList.length }}</span>
          </button>
          <button 
            class="sub-nav-btn" 
            [class.active]="activeSubTab === 'notifications'" 
            (click)="switchSubTab('notifications')">
            <span>🔔 Push Notifications & FCM</span>
            <span class="count-pill">{{ notifications.length }} / {{ fcmTokens.length }}</span>
          </button>
          <button 
            class="sub-nav-btn" 
            [class.active]="activeSubTab === 'logs'" 
            (click)="switchSubTab('logs')">
            <span>📜 Telemetry & Audit Stream</span>
            <span class="count-pill">{{ smsLogs.length }}</span>
          </button>
        </div>

        <!-- ======================================================== -->
        <!-- SUB-TAB 1: 📩 MESSAGES & LIVE OTPs -->
        <!-- ======================================================== -->
        @if (activeSubTab === 'messages') {
          <div class="tab-pane fade-in">
            <!-- Device Selector Pills Toolbar -->
            <div class="device-selector-toolbar card mb-3">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="device-toolbar-label">📱 Select Device:</span>
                  <button 
                    class="btn btn-sm" 
                    [ngClass]="filterDeviceId === 'all' ? 'btn-primary' : 'btn-outline'" 
                    (click)="setDeviceFilter('all')">
                    All Devices ({{ totalMessagesCount }})
                  </button>
                  @for (dev of devices; track dev.id) {
                    <button 
                      class="btn btn-sm" 
                      [ngClass]="filterDeviceId === dev.id.toString() ? 'btn-primary' : 'btn-outline'" 
                      (click)="setDeviceFilter(dev.id.toString())">
                      📱 {{ dev.device_name }} ({{ dev.phone_number || 'SIM 1' }}) 
                      <span class="badge ml-1" [ngClass]="filterDeviceId === dev.id.toString() ? 'badge-dark' : 'badge-secondary'">
                        {{ dev.total_messages || 0 }}
                      </span>
                    </button>
                  }
                </div>

                <div class="d-flex align-items-center gap-2">
                  <button class="btn btn-secondary btn-sm" (click)="markAllAsRead()" title="Mark all messages as read">
                    <span>Mark All Read</span>
                  </button>
                  <button class="btn btn-outline btn-sm" (click)="loadUserMessages()" [disabled]="loading">
                    <span>🔄 Refresh Messages</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Filters Toolbar -->
            <div class="card filter-toolbar">
              <div class="filter-row">
                <!-- Search query -->
                <div class="filter-col flex-2">
                  <label class="form-label-xs">🔍 Search Messages & Senders</label>
                  <input 
                    type="text" 
                    class="form-control form-control-sm" 
                    placeholder="Search Google, WhatsApp, SBI, HDFC, OTP, amount..." 
                    [(ngModel)]="searchQuery" 
                    (input)="onSearchInput()">
                </div>

                <!-- Type filter -->
                <div class="filter-col">
                  <label class="form-label-xs">🏷️ Category</label>
                  <select class="form-control form-control-sm" [(ngModel)]="filterType" (change)="onFilterChange()">
                    <option value="all">All Categories</option>
                    <option value="OTP">OTP Verification</option>
                    <option value="Bank Credit">Bank Credit</option>
                    <option value="Bank Debit">Bank Debit</option>
                    <option value="Bill Alert">Bill Alert</option>
                    <option value="Telecom">Telecom</option>
                    <option value="inbox">Inbox</option>
                  </select>
                </div>

                <!-- Read status -->
                <div class="filter-col">
                  <label class="form-label-xs">Read Status</label>
                  <select class="form-control form-control-sm" [(ngModel)]="filterReadStatus" (change)="onFilterChange()">
                    <option value="all">All Messages</option>
                    <option value="0">Unread Only</option>
                    <option value="1">Read Only</option>
                  </select>
                </div>

                <!-- Page Size -->
                <div class="filter-col action-col">
                  <label class="form-label-xs">Per Page</label>
                  <select class="form-control form-control-sm" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                    <option [value]="100">100</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Pagination Bar (Top) -->
            @if (totalMessagesCount > 0) {
              <div class="pagination-bar mb-3">
                <span class="pagination-info">
                  Showing <strong>{{ getPageStart() }}</strong> - <strong>{{ getPageEnd() }}</strong> of <strong>{{ totalMessagesCount }}</strong> Messages
                </span>
                <div class="pagination-controls">
                  <button class="btn btn-outline btn-sm" [disabled]="currentPage <= 1 || loading" (click)="goToPage(currentPage - 1)">
                    ◀ Prev
                  </button>
                  <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
                  <button class="btn btn-outline btn-sm" [disabled]="currentPage >= totalPages || loading" (click)="goToPage(currentPage + 1)">
                    Next ▶
                  </button>
                </div>
              </div>
            }

            <!-- Messages Stream Cards -->
            @if (filteredMessages.length === 0 && !loading) {
              <div class="card empty-stream-card">
                <span class="empty-emoji">📭</span>
                <h3>No SMS Messages Found</h3>
                <p class="text-muted">No messages match your search criteria for {{ selectedUser.name || selectedUser.email }}.</p>
                <button class="btn btn-primary btn-sm mt-3" (click)="openSimulateModal()">
                  <span>➕ Ingest Test SMS to this Account</span>
                </button>
              </div>
            } @else {
              <div class="messages-stream">
                @for (msg of filteredMessages; track msg.id) {
                  <div class="message-card" [class.unread-card]="!msg.is_read">
                    <!-- Message Header -->
                    <div class="message-card-header">
                      <div class="sender-info">
                        <span class="sender-icon-bubble" [ngClass]="getSenderClass(msg.sender, msg.inferred_type)">
                          {{ getSenderIcon(msg.inferred_type) }}
                        </span>
                        <div>
                          <div class="sender-name-row">
                            <strong class="sender-id">{{ msg.sender }}</strong>
                            <span class="badge" [ngClass]="getTypeBadgeClass(msg.inferred_type)">
                              {{ msg.inferred_type }}
                            </span>
                            @if (!msg.is_read) {
                              <span class="badge badge-danger new-badge">NEW</span>
                            }
                          </div>
                          <span class="device-tag">📱 {{ msg.device_name || 'Appa' }} ({{ msg.device_phone || '9943370203' }})</span>
                        </div>
                      </div>

                      <div class="message-meta-right">
                        <span class="received-time" [title]="msg.received_at">
                          🕒 {{ msg.received_at | date:'dd MMM yyyy, hh:mm a' }}
                        </span>
                      </div>
                    </div>

                    <!-- OTP Highlight Alert Box (If Message Contains an OTP) -->
                    @if (msg.is_otp && msg.otp_code) {
                      <div class="otp-highlight-strip">
                        <div class="otp-left">
                          <span class="otp-badge-icon">🔑</span>
                          <div>
                            <span class="otp-sub-label">One-Time Password Detected:</span>
                            <span class="otp-code-display">{{ msg.otp_code }}</span>
                          </div>
                        </div>
                        <button 
                          class="btn-copy-otp" 
                          [class.copied]="msg.copied"
                          (click)="copyToClipboard(msg.otp_code, msg)"
                          title="Copy OTP to clipboard">
                          <span>{{ msg.copied ? '✅ Copied!' : '📋 Copy OTP' }}</span>
                        </button>
                      </div>
                    }

                    <!-- Message Content -->
                    <div class="message-body-text">
                      {{ msg.message }}
                    </div>

                    <!-- Footer Actions -->
                    <div class="message-card-footer">
                      <div class="footer-status">
                        <button 
                          class="read-toggle-btn" 
                          [class.read]="msg.is_read" 
                          (click)="toggleReadStatus(msg)">
                          <span>{{ msg.is_read ? '✅ Read' : '⚪ Mark as Read' }}</span>
                        </button>
                      </div>

                      <div class="footer-actions">
                        <button class="icon-action-btn delete-btn" (click)="deleteMessage(msg)" title="Delete Message">
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Pagination Bar (Bottom) -->
              @if (totalPages > 1) {
                <div class="pagination-bar mt-3">
                  <span class="pagination-info">
                    Page {{ currentPage }} of {{ totalPages }} ({{ totalMessagesCount }} total)
                  </span>
                  <div class="pagination-controls">
                    <button class="btn btn-outline btn-sm" [disabled]="currentPage <= 1 || loading" (click)="goToPage(currentPage - 1)">
                      ◀ Prev
                    </button>
                    <button class="btn btn-outline btn-sm" [disabled]="currentPage >= totalPages || loading" (click)="goToPage(currentPage + 1)">
                      Next ▶
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        }

        <!-- ======================================================== -->
        <!-- SUB-TAB 2: 📲 MONITORED DEVICES (sms_devices) -->
        <!-- ======================================================== -->
        @if (activeSubTab === 'devices') {
          <div class="tab-pane fade-in">
            <div class="content-bar-sub">
              <div>
                <h3>Monitored Devices for {{ selectedUser.name || selectedUser.email }}</h3>
                <p class="text-muted">Android phones associated with this account forwarding SMS and notifications</p>
              </div>
              <button class="btn btn-primary" (click)="openAddDeviceModal()">
                <span>➕ Register New Phone</span>
              </button>
            </div>

            @if (devices.length === 0) {
              <div class="card empty-stream-card">
                <span class="empty-emoji">📱</span>
                <h3>No Devices Registered for this User</h3>
                <p class="text-muted">Add a phone device (e.g. Dad's Samsung Galaxy) to begin capturing incoming SMS.</p>
                <button class="btn btn-primary btn-sm mt-3" (click)="openAddDeviceModal()">
                  <span>➕ Register First Device</span>
                </button>
              </div>
            } @else {
              <div class="devices-grid">
                @for (dev of devices; track dev.id) {
                  <div class="card device-card">
                    <div class="device-card-header">
                      <div class="device-brand-row">
                        <span class="device-icon">📱</span>
                        <div>
                          <h4 class="device-name">{{ dev.device_name }}</h4>
                          <span class="device-phone">{{ dev.phone_number || 'No SIM Assigned' }}</span>
                        </div>
                      </div>
                      <span class="status-indicator-badge live-badge">🟢 Connected</span>
                    </div>

                    <div class="device-stats-grid">
                      <div class="device-stat">
                        <span class="stat-lbl">Total SMS</span>
                        <strong class="stat-num text-primary">{{ dev.total_messages || 0 }}</strong>
                      </div>
                      <div class="device-stat">
                        <span class="stat-lbl">Unread</span>
                        <strong class="stat-num text-danger">{{ dev.unread_messages || 0 }}</strong>
                      </div>
                      <div class="device-stat">
                        <span class="stat-lbl">Role</span>
                        <strong class="stat-num text-primary">{{ dev.role === 'owner' ? 'Owner' : 'Shared' }}</strong>
                      </div>
                    </div>

                    <div class="device-meta-row">
                      <span>Owner: <strong>{{ dev.owner_name || selectedUser.name || 'User' }}</strong></span>
                      <span class="text-xs text-muted">Latest: {{ dev.latest_message_at ? (dev.latest_message_at | date:'dd MMM, hh:mm a') : 'No SMS yet' }}</span>
                    </div>

                    <div class="device-card-actions">
                      <button class="btn btn-warning btn-sm" (click)="triggerSingleDeviceSync(dev)" title="Trigger SMS sync for this device">
                        ⚡ Sync
                      </button>
                      <button class="btn btn-secondary btn-sm flex-1" (click)="openSimulateForDevice(dev)">
                        📩 Simulate SMS
                      </button>
                      <button class="btn btn-danger btn-sm" (click)="deleteDevice(dev)">
                        🗑️
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ======================================================== -->
        <!-- SUB-TAB 3: 🔐 ACCESS MATRIX (sms_user_device_access) -->
        <!-- ======================================================== -->
        @if (activeSubTab === 'access') {
          <div class="tab-pane fade-in">
            <div class="content-bar-sub">
              <div>
                <h3>Device Access Matrix & Family Sharing</h3>
                <p class="text-muted">Manage granular permissions for who can view SMS, receive push alerts, and delete logs</p>
              </div>
              <button class="btn btn-primary" (click)="openGrantAccessModal()">
                <span>➕ Grant Device Access</span>
              </button>
            </div>

            @if (accessList.length === 0) {
              <div class="card empty-stream-card">
                <span class="empty-emoji">🔐</span>
                <h3>No Access Permissions Found</h3>
                <p class="text-muted">Grant access to other family members or administrators to monitor this user's devices.</p>
                <button class="btn btn-primary btn-sm mt-3" (click)="openGrantAccessModal()">
                  <span>➕ Grant Access</span>
                </button>
              </div>
            } @else {
              <div class="card p-0">
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Device</th>
                        <th>Authorized User</th>
                        <th style="text-align: center;">View SMS</th>
                        <th style="text-align: center;">Delete SMS</th>
                        <th style="text-align: center;">Push Alerts</th>
                        <th style="text-align: center;">Send SMS</th>
                        <th style="text-align: right;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (acc of accessList; track acc.id) {
                        <tr>
                          <td>
                            <strong>📱 {{ acc.device_name }}</strong>
                            <span class="d-block text-xs text-muted">{{ acc.device_owner ? 'Owner: ' + acc.device_owner : '' }}</span>
                          </td>
                          <td>
                            <strong>{{ acc.user_name || 'User' }}</strong>
                            <span class="d-block text-xs text-muted">{{ acc.user_email }}</span>
                          </td>
                          <td style="text-align: center;">
                            <input 
                              type="checkbox" 
                              [checked]="acc.can_view_messages" 
                              (change)="toggleAccessPermission(acc, 'can_view_messages')">
                          </td>
                          <td style="text-align: center;">
                            <input 
                              type="checkbox" 
                              [checked]="acc.can_delete_messages" 
                              (change)="toggleAccessPermission(acc, 'can_delete_messages')">
                          </td>
                          <td style="text-align: center;">
                            <input 
                              type="checkbox" 
                              [checked]="acc.can_receive_notifications" 
                              (change)="toggleAccessPermission(acc, 'can_receive_notifications')">
                          </td>
                          <td style="text-align: center;">
                            <input 
                              type="checkbox" 
                              [checked]="acc.can_send_sms" 
                              (change)="toggleAccessPermission(acc, 'can_send_sms')">
                          </td>
                          <td style="text-align: right;">
                            <button class="btn btn-sm btn-danger" (click)="revokeAccess(acc)">
                              Revoke
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

        <!-- ======================================================== -->
        <!-- SUB-TAB 4: 🔔 NOTIFICATIONS & FCM TOKENS -->
        <!-- ======================================================== -->
        @if (activeSubTab === 'notifications') {
          <div class="tab-pane fade-in">
            <!-- Active FCM Tokens -->
            <div class="content-bar-sub">
              <div>
                <h3>FCM Push Notification Tokens</h3>
                <p class="text-muted">Registered Firebase Cloud Messaging device tokens for {{ selectedUser.name || selectedUser.email }}</p>
              </div>
            </div>

            @if (fcmTokens.length === 0) {
              <div class="card empty-stream-card mb-4">
                <span class="empty-emoji">📲</span>
                <h3>No FCM Tokens Registered for this User</h3>
                <p class="text-muted">This user has not registered an active mobile browser or Android app push token.</p>
              </div>
            } @else {
              <div class="card p-0 mb-4">
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th style="width: 70px;">ID</th>
                        <th>Device Info</th>
                        <th>Token Snippet</th>
                        <th>Status</th>
                        <th>Registered At</th>
                        <th style="text-align: right;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (tok of fcmTokens; track tok.id) {
                        <tr>
                          <td>#{{ tok.id }}</td>
                          <td><strong>{{ tok.device_info || 'Mobile Android Device' }}</strong></td>
                          <td>
                            <code class="token-code">{{ tok.fcm_token ? (tok.fcm_token.slice(0, 30) + '...') : 'N/A' }}</code>
                          </td>
                          <td>
                            <span class="badge" [ngClass]="tok.is_active ? 'badge-success' : 'badge-secondary'">
                              {{ tok.is_active ? 'ACTIVE' : 'INACTIVE' }}
                            </span>
                          </td>
                          <td>{{ tok.created_at | date:'dd MMM yyyy, hh:mm a' }}</td>
                          <td style="text-align: right;">
                            <button class="btn btn-sm btn-secondary mr-2" (click)="toggleFcmToken(tok)">
                              {{ tok.is_active ? 'Deactivate' : 'Activate' }}
                            </button>
                            <button class="btn btn-sm btn-danger" (click)="deleteFcmToken(tok)">
                              Delete
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Push Notification Dispatch Logs -->
            <div class="content-bar-sub mt-4">
              <div>
                <h3>Dispatched Push Notifications Log (sms_notifications)</h3>
                <p class="text-muted">Push alerts delivered to this user upon SMS arrival on Dad's phone</p>
              </div>
            </div>

            @if (notifications.length === 0) {
              <div class="card empty-stream-card">
                <span class="empty-emoji">🔔</span>
                <h3>No Push Notifications Dispatched Yet</h3>
                <p class="text-muted">When an SMS arrives and triggers a push alert, dispatch records appear here.</p>
              </div>
            } @else {
              <div class="card p-0">
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th style="width: 70px;">ID</th>
                        <th>Sender</th>
                        <th>Message Preview</th>
                        <th>Device</th>
                        <th>Status</th>
                        <th>Sent At</th>
                        <th style="text-align: right;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (n of notifications; track n.id) {
                        <tr>
                          <td>#{{ n.id }}</td>
                          <td><span class="badge badge-secondary">{{ n.msg_sender }}</span></td>
                          <td><span class="snippet-text">{{ n.msg_content }}</span></td>
                          <td>📱 {{ n.device_name }}</td>
                          <td>
                            <span class="badge" [ngClass]="n.delivery_status === 'sent' ? 'badge-success' : (n.delivery_status === 'failed' ? 'badge-danger' : 'badge-warning')">
                              {{ n.delivery_status | uppercase }}
                            </span>
                          </td>
                          <td>{{ n.sent_at | date:'dd MMM, hh:mm a' }}</td>
                          <td style="text-align: right;">
                            @if (n.delivery_status !== 'sent') {
                              <button class="btn btn-sm btn-secondary" (click)="retryNotification(n)">
                                🔄 Retry
                              </button>
                            } @else {
                              <span class="text-xs text-success">Delivered</span>
                            }
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

        <!-- ======================================================== -->
        <!-- SUB-TAB 5: 📜 TELEMETRY & AUDIT STREAM (sms_log) -->
        <!-- ======================================================== -->
        @if (activeSubTab === 'logs') {
          <div class="tab-pane fade-in">
            <div class="content-bar-sub">
              <div>
                <h3>System Telemetry & Synchronization Logs (sms_log)</h3>
                <p class="text-muted">Live microservice daemon heartbeat, sync dispatches, and incoming SMS ingestion logs</p>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="clearAllLogs()">
                🗑️ Clear All Logs
              </button>
            </div>

            <div class="card p-0">
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width: 80px;">ID</th>
                      <th style="width: 200px;">Event Title</th>
                      <th>Telemetry Details</th>
                      <th style="width: 180px;">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (log of smsLogs; track log.id) {
                      <tr>
                        <td>#{{ log.id }}</td>
                        <td><strong class="text-primary">{{ log.title }}</strong></td>
                        <td><code class="log-message-code">{{ log.message }}</code></td>
                        <td><span class="text-xs text-muted">{{ log.inserted_at | date:'dd MMM yyyy, hh:mm:ss a' }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      } @else {
        <!-- No User Selected State -->
        <div class="card empty-stream-card mt-4">
          <span class="empty-emoji">👆</span>
          <h3>Please Select an Account Above</h3>
          <p class="text-muted">Choose an account (e.g. alagappantk@gmail.com / Appa) from Step 1 above to load monitored SMS data and controls.</p>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL: SIMULATE / INGEST SMS -->
      <!-- ======================================================== -->
      @if (showSimulateModal) {
        <div class="modal-backdrop fade-in" (click)="closeSimulateModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Ingest / Simulate Incoming SMS</h3>
              <button class="close-btn" (click)="closeSimulateModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Target Phone Device</label>
                <select class="form-control" [(ngModel)]="simulateFormData.device_id">
                  @for (dev of (devices.length > 0 ? devices : allDevices); track dev.id) {
                    <option [value]="dev.id">{{ dev.device_name }} ({{ dev.phone_number || 'SIM 1' }})</option>
                  }
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Sender Identifier</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="e.g. AX-SBINB, VK-HDFCBK, VM-AIRTEL, Google" 
                  [(ngModel)]="simulateFormData.sender">
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Category</label>
                <select class="form-control" [(ngModel)]="simulateFormData.type">
                  <option value="OTP">OTP Verification</option>
                  <option value="Bank Credit">Bank Credit</option>
                  <option value="Bank Debit">Bank Debit</option>
                  <option value="Bill Alert">Bill Alert</option>
                  <option value="Telecom">Telecom Alert</option>
                  <option value="inbox">Inbox</option>
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">SMS Body Text</label>
                <textarea 
                  class="form-control" 
                  rows="4" 
                  placeholder="e.g. Your OTP for SBI Netbanking login is 482910. Do not share this with anyone." 
                  [(ngModel)]="simulateFormData.message"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeSimulateModal()" [disabled]="saving">Cancel</button>
              <button class="btn btn-primary" (click)="submitSimulateSms()" [disabled]="saving">
                {{ saving ? 'Ingesting...' : 'Ingest SMS' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL: REGISTER / EDIT PHONE DEVICE -->
      <!-- ======================================================== -->
      @if (showDeviceModal) {
        <div class="modal-backdrop fade-in" (click)="closeDeviceModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditingDevice ? 'Edit Phone Device' : 'Register New Android Device' }}</h3>
              <button class="close-btn" (click)="closeDeviceModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Device Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="e.g. Dad's Samsung Galaxy S21" 
                  [(ngModel)]="deviceFormData.device_name">
              </div>

              <div class="form-group mb-3">
                <label class="form-label">SIM Phone Number</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="+91 98765 43210" 
                  [(ngModel)]="deviceFormData.phone_number">
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Device Owner Account</label>
                <select class="form-control" [(ngModel)]="deviceFormData.owner_id">
                  @for (u of smsUsers; track u.id) {
                    <option [value]="u.id">{{ u.name || u.email }} ({{ formatUserType(u.user_type) }})</option>
                  }
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDeviceModal()" [disabled]="saving">Cancel</button>
              <button class="btn btn-primary" (click)="submitDevice()" [disabled]="saving">
                {{ saving ? 'Saving...' : (isEditingDevice ? 'Update Device' : 'Register Device') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL: GRANT DEVICE ACCESS -->
      <!-- ======================================================== -->
      @if (showGrantAccessModal) {
        <div class="modal-backdrop fade-in" (click)="closeGrantAccessModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Grant Device Access Privilege</h3>
              <button class="close-btn" (click)="closeGrantAccessModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Select User to Grant Access</label>
                <select class="form-control" [(ngModel)]="grantFormData.user_id">
                  @for (u of smsUsers; track u.id) {
                    <option [value]="u.id">{{ u.name || u.email }} ({{ formatUserType(u.user_type) }})</option>
                  }
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Target Device</label>
                <select class="form-control" [(ngModel)]="grantFormData.device_id">
                  @for (dev of (devices.length > 0 ? devices : allDevices); track dev.id) {
                    <option [value]="dev.id">{{ dev.device_name }}</option>
                  }
                </select>
              </div>

              <div class="permission-checkboxes mt-3">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="grantFormData.can_view_messages">
                  <span>Allow viewing SMS messages</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="grantFormData.can_delete_messages">
                  <span>Allow deleting SMS messages</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="grantFormData.can_receive_notifications">
                  <span>Receive push alerts on new SMS</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="grantFormData.can_send_sms">
                  <span>Allow sending outbound SMS</span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeGrantAccessModal()" [disabled]="saving">Cancel</button>
              <button class="btn btn-primary" (click)="submitGrantAccess()" [disabled]="saving">
                {{ saving ? 'Granting...' : 'Grant Access' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL: CREATE NEW USER -->
      <!-- ======================================================== -->
      @if (showUserModal) {
        <div class="modal-backdrop fade-in" (click)="closeUserModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create SMS Monitored User</h3>
              <button class="close-btn" (click)="closeUserModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Full Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="e.g. Appa (Dad), Veera" 
                  [(ngModel)]="userFormData.name">
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Email Address</label>
                <input 
                  type="email" 
                  class="form-control" 
                  placeholder="e.g. dad@example.com" 
                  [(ngModel)]="userFormData.email">
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Account Role</label>
                <select class="form-control" [(ngModel)]="userFormData.user_type">
                  <option value="parent">Parent (Phone Owner)</option>
                  <option value="admin">Administrator (Monitor)</option>
                  <option value="child">Child / Family Member</option>
                </select>
              </div>

              <label class="checkbox-label mt-2">
                <input type="checkbox" [(ngModel)]="userFormData.is_admin">
                <span>Grant Full Admin Privileges</span>
              </label>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeUserModal()" [disabled]="saving">Cancel</button>
              <button class="btn btn-primary" (click)="submitSmsUser()" [disabled]="saving">
                {{ saving ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sms-panel-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Header Strip */
    .panel-header-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }
    .header-title-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .telemetry-icon {
      font-size: 2.2rem;
    }
    .panel-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }
    .panel-subtitle {
      font-size: 0.825rem;
      color: var(--text-muted);
      margin: 0.25rem 0 0;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .daemon-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.85rem;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .live-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse-green 2s infinite;
    }
    @keyframes pulse-green {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* STEP 1: USER SELECTOR */
    .user-selector-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .user-selector-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .step-indicator {
      display: inline-block;
      background: var(--primary);
      color: #ffffff;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .user-selector-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }
    .user-selector-desc {
      font-size: 0.825rem;
      color: var(--text-muted);
      margin: 0.15rem 0 0;
    }
    .email-dropdown-wrap {
      background: #f8fafc;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }
    .email-select-input {
      font-size: 0.95rem;
      font-weight: 700;
      min-width: 320px;
      flex: 1;
    }
    .user-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .user-card {
      background: #f8fafc;
      border: 2px solid transparent;
      border-radius: var(--radius-md);
      padding: 1rem 1.15rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .user-card:hover {
      background: #f1f5f9;
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .user-card.selected {
      background: #ffffff;
      border-color: var(--primary);
      box-shadow: 0 0 0 1px var(--primary), 0 8px 20px -4px rgba(99, 102, 241, 0.2);
    }
    .user-card-top {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .user-avatar-wrap {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.45rem;
      flex-shrink: 0;
    }
    .selected-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #10b981;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
    }
    .user-identity {
      flex: 1;
      min-width: 0;
    }
    .user-name-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
    }
    .user-name {
      font-size: 0.95rem;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-email {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-card-stats {
      display: flex;
      gap: 0.5rem;
      background: #ffffff;
      padding: 0.45rem 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }
    .user-card.selected .user-card-stats {
      background: #f8fafc;
    }
    .user-stat-chip {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .chip-label {
      font-size: 0.675rem;
      color: var(--text-muted);
    }
    .chip-val {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .user-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }
    .unread-alert-pill {
      font-size: 0.65rem;
      padding: 2px 6px;
      animation: pulse-unread 2s infinite;
    }
    @keyframes pulse-unread {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    /* ACTIVE USER FOCUS BANNER */
    .active-user-ribbon {
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: #ffffff;
      border-radius: var(--radius-md);
      padding: 1.15rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
    }
    .active-ribbon-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .ribbon-avatar {
      font-size: 2.2rem;
      background: rgba(255, 255, 255, 0.2);
      width: 54px;
      height: 54px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ribbon-tag {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      background: rgba(255, 255, 255, 0.25);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .ribbon-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .ribbon-name {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
    }
    .ribbon-meta-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      opacity: 0.9;
      flex-wrap: wrap;
    }
    .active-ribbon-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    /* Sub Navigation Bar */
    .sub-nav-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color);
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }
    .sub-nav-btn {
      background: none;
      border: none;
      padding: 0.65rem 1.15rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      position: relative;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .sub-nav-btn:hover {
      color: var(--text-main);
      background: #f1f5f9;
    }
    .sub-nav-btn.active {
      color: var(--primary);
      background: #ffffff;
      border-bottom: 3px solid var(--primary);
    }
    .count-pill {
      font-size: 0.725rem;
      background: #e2e8f0;
      color: var(--text-main);
      padding: 2px 6px;
      border-radius: 9999px;
    }
    .sub-nav-btn.active .count-pill {
      background: var(--primary);
      color: #ffffff;
    }

    /* Device Selector Toolbar */
    .device-selector-toolbar {
      padding: 0.75rem 1.25rem;
      background: #ffffff;
      border-left: 4px solid var(--primary);
    }
    .device-toolbar-label {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--text-main);
    }

    /* Filter Toolbar */
    .filter-toolbar {
      padding: 0.85rem 1.25rem;
      margin-bottom: 0.75rem;
    }
    .filter-row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .filter-col {
      flex: 1;
      min-width: 140px;
    }
    .flex-2 {
      flex: 2;
      min-width: 220px;
    }
    .action-col {
      flex: 0 0 auto;
    }
    .form-label-xs {
      font-size: 0.725rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
      display: block;
    }
    .form-control-sm {
      min-height: 36px;
      padding: 0.35rem 0.65rem;
      font-size: 0.85rem;
    }

    /* Pagination Bar */
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 1rem;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 0.825rem;
    }
    .pagination-info {
      color: var(--text-muted);
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .page-indicator {
      font-weight: 700;
      color: var(--text-main);
      padding: 0 0.5rem;
    }

    /* Messages Stream */
    .messages-stream {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .message-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .message-card:hover {
      box-shadow: var(--shadow-md);
    }
    .message-card.unread-card {
      border-left: 4px solid var(--primary);
      background: #faf5ff;
    }
    .message-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .sender-info {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .sender-icon-bubble {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      background: #eef2ff;
      flex-shrink: 0;
    }
    .bubble-bank { background: #e0e7ff; color: #4338ca; }
    .bubble-otp { background: #fef3c7; color: #b45309; }
    .bubble-bill { background: #fee2e2; color: #b91c1c; }
    .bubble-telecom { background: #dbeafe; color: #1d4ed8; }

    .sender-name-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .sender-id {
      font-size: 0.95rem;
      color: var(--text-main);
    }
    .device-tag {
      font-size: 0.725rem;
      color: var(--text-muted);
    }
    .received-time {
      font-size: 0.75rem;
      color: var(--text-light);
    }
    .new-badge {
      font-size: 0.625rem;
      padding: 2px 5px;
    }

    /* OTP Highlight Strip */
    .otp-highlight-strip {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .otp-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .otp-badge-icon {
      font-size: 1.25rem;
    }
    .otp-sub-label {
      font-size: 0.725rem;
      color: #92400e;
      display: block;
    }
    .otp-code-display {
      font-size: 1.35rem;
      font-weight: 900;
      color: #b45309;
      letter-spacing: 0.1em;
      line-height: 1.1;
    }
    .btn-copy-otp {
      background: #f59e0b;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-sm);
      padding: 0.4rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-copy-otp:hover {
      background: #d97706;
    }
    .btn-copy-otp.copied {
      background: #10b981;
    }

    .message-body-text {
      font-size: 0.9rem;
      line-height: 1.5;
      color: var(--text-main);
      word-break: break-word;
    }
    .message-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--border-color);
    }
    .read-toggle-btn {
      background: none;
      border: none;
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0;
    }
    .read-toggle-btn.read {
      color: #10b981;
    }
    .icon-action-btn {
      background: none;
      border: none;
      font-size: 0.775rem;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      color: var(--text-muted);
    }
    .delete-btn:hover {
      background: #fee2e2;
      color: #b91c1c;
    }

    /* Devices Grid */
    .content-bar-sub {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .content-bar-sub h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .device-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .device-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .device-brand-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .device-icon {
      font-size: 1.6rem;
    }
    .device-name {
      font-size: 1rem;
      font-weight: 800;
      margin: 0;
      color: var(--text-main);
    }
    .device-phone {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .status-indicator-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
    }
    .live-badge {
      background: #ecfdf5;
      color: #065f46;
    }
    .device-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      background: #f8fafc;
      padding: 0.65rem;
      border-radius: var(--radius-sm);
    }
    .device-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-lbl {
      font-size: 0.675rem;
      color: var(--text-muted);
    }
    .stat-num {
      font-size: 1rem;
      font-weight: 800;
    }
    .device-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .device-card-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }

    /* Table styles */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th, .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      font-size: 0.725rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .token-code {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    .snippet-text {
      font-size: 0.825rem;
      color: var(--text-main);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      max-width: 320px;
    }
    .log-message-code {
      font-size: 0.775rem;
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 4px;
      display: block;
      color: #334155;
      font-family: monospace;
      max-height: 80px;
      overflow-y: auto;
    }

    /* Empty state */
    .empty-stream-card {
      text-align: center;
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .empty-emoji {
      font-size: 2.8rem;
      margin-bottom: 0.5rem;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-muted);
    }
    .modal-body {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 70vh;
      overflow-y: auto;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background: #f8fafc;
    }
    .permission-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      background: #f8fafc;
      padding: 0.85rem;
      border-radius: var(--radius-sm);
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      cursor: pointer;
    }
  `]
})
export class SmsGatewayPanelComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  // Users & Selected User Scope
  smsUsers: SmsUser[] = [];
  selectedEmail = 'alagappantk@gmail.com'; // Default to Dad's account
  selectedUser: SmsUser | null = null;
  selectedUserSummary: SmsUserSummary | null = null;

  activeSubTab: 'messages' | 'devices' | 'access' | 'notifications' | 'logs' = 'messages';

  overview: SmsGatewayOverview | null = null;
  messages: SmsMessage[] = [];
  filteredMessages: SmsMessage[] = [];
  devices: SmsDevice[] = [];
  allDevices: SmsDevice[] = [];
  notifications: SmsNotification[] = [];
  accessList: SmsUserDeviceAccess[] = [];
  fcmTokens: SmsUserFcmToken[] = [];
  smsLogs: SmsLog[] = [];

  // Filter States
  searchQuery = '';
  filterDeviceId = 'all';
  filterType = 'all';
  filterReadStatus = 'all';

  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalMessagesCount = 0;
  unreadMessagesCount = 0;
  recentOtpCount = 0;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalMessagesCount / this.pageSize));
  }

  loading = false;
  saving = false;
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';

  // Modals
  showSimulateModal = false;
  simulateFormData = {
    device_id: 8,
    sender: 'AX-SBINB',
    message: '',
    type: 'OTP'
  };

  showDeviceModal = false;
  isEditingDevice = false;
  editingDeviceId: number | null = null;
  deviceFormData = {
    device_name: '',
    phone_number: '',
    owner_id: 2,
    owner_name: ''
  };

  showGrantAccessModal = false;
  grantFormData = {
    user_id: 2,
    device_id: 8,
    can_view_messages: true,
    can_delete_messages: true,
    can_receive_notifications: true,
    can_send_sms: false
  };

  showUserModal = false;
  userFormData = {
    name: '',
    email: '',
    user_type: 'child',
    is_admin: false
  };

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.loading = true;
    this.loadOverview();
    this.loadSmsUsers();
    this.loadAllDevices();
    this.loadLogs();
  }

  loadOverview() {
    this.api.getSmsOverview().subscribe({
      next: (res) => {
        if (res.success) this.overview = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load overview:', err)
    });
  }

  loadSmsUsers() {
    this.api.getSmsUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.smsUsers = res.data;
          // Determine which email to select:
          // Prefer 'alagappantk@gmail.com' (Appa with 1543 messages) or first with messages
          if (!this.selectedUser) {
            const defaultUser = 
              this.smsUsers.find(u => u.email === this.selectedEmail) || 
              this.smsUsers.find(u => (u.total_messages_count || 0) > 0) || 
              this.smsUsers[0];
            
            if (defaultUser) {
              this.selectUserByEmail(defaultUser.email);
            }
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load SMS users:', err)
    });
  }

  loadAllDevices() {
    this.api.getSmsDevices().subscribe({
      next: (res) => {
        if (res.success) this.allDevices = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load all devices:', err)
    });
  }

  /**
   * Recreates the login.php user lookup flow:
   * Finds the user by email without requiring a password in the admin panel,
   * then loads their accessible devices and live SMS data.
   */
  selectUserByEmail(email: string) {
    if (!email) return;
    this.selectedEmail = email;
    this.loading = true;

    this.api.getSmsUserByEmail(email).subscribe({
      next: (res) => {
        if (res.success && res.user) {
          this.selectedUser = res.user;
          this.devices = res.devices || [];

          // Auto-select the active device (device with messages or first device)
          if (res.activeDevice) {
            this.filterDeviceId = res.activeDevice.id.toString();
            this.simulateFormData.device_id = res.activeDevice.id;
          } else if (this.devices.length > 0) {
            this.filterDeviceId = this.devices[0].id.toString();
            this.simulateFormData.device_id = this.devices[0].id;
          } else {
            this.filterDeviceId = 'all';
          }

          this.currentPage = 1;
          this.loadUserMessages();
          this.loadUserAccess();
          this.loadUserNotifications();
          this.loadUserFcmTokens();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to select user by email:', err);
        // Fallback: try by local user list
        const match = this.smsUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (match) {
          this.selectedUser = match;
          this.loadUserMessages();
          this.loadUserAccess();
        }
        this.cdr.markForCheck();
      }
    });
  }

  setDeviceFilter(devId: string) {
    this.filterDeviceId = devId;
    this.currentPage = 1;
    this.loadUserMessages();
  }

  loadUserMessages() {
    if (!this.selectedUser) return;
    this.loading = true;

    const offset = (this.currentPage - 1) * this.pageSize;

    this.api.getUserMessages(this.selectedUser.id, {
      device_id: this.filterDeviceId,
      search: this.searchQuery,
      type: this.filterType,
      is_read: this.filterReadStatus,
      limit: this.pageSize,
      offset: offset
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.messages = res.data;
          this.filteredMessages = res.data;

          if (res.pagination) {
            this.totalMessagesCount = res.pagination.total;
          } else {
            this.totalMessagesCount = res.data.length;
          }

          // Count unreads and OTPs in current slice
          this.unreadMessagesCount = this.messages.filter(m => !m.is_read).length;
          this.recentOtpCount = this.messages.filter(m => m.is_otp).length;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load user messages:', err);
      }
    });
  }

  loadUserAccess() {
    if (!this.selectedUser) return;
    this.api.getUserAccess(this.selectedUser.id).subscribe({
      next: (res) => {
        if (res.success) this.accessList = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load user access:', err)
    });
  }

  loadUserNotifications() {
    if (!this.selectedUser) return;
    this.api.getUserNotifications(this.selectedUser.id).subscribe({
      next: (res) => {
        if (res.success) this.notifications = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load user notifications:', err)
    });
  }

  loadUserFcmTokens() {
    if (!this.selectedUser) return;
    this.api.getUserFcmTokens(this.selectedUser.id).subscribe({
      next: (res) => {
        if (res.success) this.fcmTokens = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load user FCM tokens:', err)
    });
  }

  loadLogs() {
    this.api.getSmsLogs({ limit: 100 }).subscribe({
      next: (res) => {
        if (res.success) this.smsLogs = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load logs:', err)
    });
  }

  switchSubTab(tab: 'messages' | 'devices' | 'access' | 'notifications' | 'logs') {
    this.activeSubTab = tab;
    if (tab === 'messages') this.loadUserMessages();
    else if (tab === 'devices') this.selectUserByEmail(this.selectedEmail);
    else if (tab === 'access') this.loadUserAccess();
    else if (tab === 'notifications') {
      this.loadUserNotifications();
      this.loadUserFcmTokens();
    } else if (tab === 'logs') {
      this.loadLogs();
    }
  }

  onSearchInput() {
    this.currentPage = 1;
    this.loadUserMessages();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadUserMessages();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadUserMessages();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUserMessages();
  }

  getPageStart(): number {
    if (this.totalMessagesCount === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getPageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalMessagesCount);
  }

  // ==========================================
  // MESSAGE OPERATIONS
  // ==========================================

  copyToClipboard(text: string | null | undefined, msg: SmsMessage) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      msg.copied = true;
      this.showAlert(`OTP code ${text} copied to clipboard!`, 'success');
      this.cdr.markForCheck();
      setTimeout(() => {
        msg.copied = false;
        this.cdr.markForCheck();
      }, 2500);
    }).catch(() => {
      this.showAlert('Could not copy to clipboard', 'error');
    });
  }

  toggleReadStatus(msg: SmsMessage) {
    if (!this.selectedUser) return;
    const nextVal = !msg.is_read;
    this.api.toggleUserMessageRead(this.selectedUser.id, msg.id, nextVal).subscribe({
      next: () => {
        msg.is_read = nextVal ? 1 : 0;
        this.showAlert(`Message marked as ${nextVal ? 'read' : 'unread'}`, 'success');
        this.loadSmsUsers();
        this.cdr.markForCheck();
      },
      error: () => this.showAlert('Failed to update read status', 'error')
    });
  }

  markAllAsRead() {
    this.api.markAllSmsRead(this.filterDeviceId !== 'all' ? parseInt(this.filterDeviceId, 10) : undefined).subscribe({
      next: (res) => {
        this.showAlert(res.message || 'All messages marked as read', 'success');
        this.loadUserMessages();
        this.loadSmsUsers();
      },
      error: () => this.showAlert('Failed to mark all as read', 'error')
    });
  }

  deleteMessage(msg: SmsMessage) {
    if (!this.selectedUser) return;
    if (!confirm(`Delete message from "${msg.sender}"?`)) return;

    this.api.deleteUserMessage(this.selectedUser.id, msg.id).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== msg.id);
        this.filteredMessages = this.filteredMessages.filter(m => m.id !== msg.id);
        this.totalMessagesCount = Math.max(0, this.totalMessagesCount - 1);
        this.showAlert('Message deleted successfully', 'success');
        this.loadSmsUsers();
      },
      error: () => this.showAlert('Failed to delete message', 'error')
    });
  }

  // ==========================================
  // DEVICE & SYNC OPERATIONS
  // ==========================================

  triggerSelectedUserSync() {
    if (!this.selectedUser) return;
    const targetDevId = this.filterDeviceId !== 'all' ? parseInt(this.filterDeviceId, 10) : undefined;
    this.api.triggerUserDeviceSync(this.selectedUser.id, { device_id: targetDevId }).subscribe({
      next: (res) => {
        this.showAlert(res.message || 'Sync signal dispatched to phone device(s)', 'success');
        this.loadUserMessages();
        this.loadLogs();
      },
      error: () => this.showAlert('Failed to dispatch sync signal', 'error')
    });
  }

  triggerSingleDeviceSync(dev: SmsDevice) {
    if (!this.selectedUser) return;
    this.api.triggerUserDeviceSync(this.selectedUser.id, { device_id: dev.id }).subscribe({
      next: (res) => {
        this.showAlert(res.message || `Sync signal sent to ${dev.device_name}`, 'success');
        this.loadUserMessages();
        this.loadLogs();
      },
      error: () => this.showAlert('Failed to dispatch sync signal', 'error')
    });
  }

  openSimulateModal() {
    if (this.filterDeviceId !== 'all') {
      this.simulateFormData.device_id = parseInt(this.filterDeviceId, 10);
    } else if (this.devices.length > 0) {
      this.simulateFormData.device_id = this.devices[0].id;
    } else if (this.allDevices.length > 0) {
      this.simulateFormData.device_id = this.allDevices[0].id;
    }
    this.simulateFormData.message = '';
    this.showSimulateModal = true;
  }

  openSimulateForDevice(dev: SmsDevice) {
    this.simulateFormData.device_id = dev.id;
    this.simulateFormData.message = '';
    this.showSimulateModal = true;
  }

  closeSimulateModal() {
    this.showSimulateModal = false;
  }

  submitSimulateSms() {
    if (!this.simulateFormData.device_id || !this.simulateFormData.sender || !this.simulateFormData.message) {
      this.showAlert('Please fill in device, sender, and message content', 'error');
      return;
    }

    this.saving = true;
    const uid = this.selectedUser ? this.selectedUser.id : 2;

    this.api.ingestUserMessage(uid, this.simulateFormData).subscribe({
      next: () => {
        this.saving = false;
        this.closeSimulateModal();
        this.showAlert('SMS ingested successfully & push dispatched', 'success');
        this.loadUserMessages();
        this.loadSmsUsers();
        this.loadLogs();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.error || 'Failed to ingest message', 'error');
      }
    });
  }

  openAddDeviceModal() {
    this.isEditingDevice = false;
    this.editingDeviceId = null;
    this.deviceFormData = {
      device_name: '',
      phone_number: '',
      owner_id: this.selectedUser ? this.selectedUser.id : 2,
      owner_name: this.selectedUser ? (this.selectedUser.name || '') : ''
    };
    this.showDeviceModal = true;
  }

  closeDeviceModal() {
    this.showDeviceModal = false;
  }

  submitDevice() {
    if (!this.deviceFormData.device_name) {
      this.showAlert('Device name is required', 'error');
      return;
    }

    this.saving = true;
    const uid = this.selectedUser ? this.selectedUser.id : this.deviceFormData.owner_id;

    this.api.createUserDevice(uid, {
      device_name: this.deviceFormData.device_name,
      phone_number: this.deviceFormData.phone_number,
      owner_name: this.selectedUser?.name || this.deviceFormData.owner_name
    }).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeviceModal();
        this.showAlert('Device registered successfully', 'success');
        this.selectUserByEmail(this.selectedEmail);
        this.loadAllDevices();
        this.loadSmsUsers();
        this.loadLogs();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.error || 'Failed to register device', 'error');
      }
    });
  }

  deleteDevice(dev: SmsDevice) {
    if (!confirm(`Delete phone device "${dev.device_name}"?`)) return;
    this.api.deleteSmsDevice(dev.id).subscribe({
      next: () => {
        this.showAlert('Device removed', 'success');
        this.selectUserByEmail(this.selectedEmail);
        this.loadAllDevices();
        this.loadSmsUsers();
      },
      error: () => this.showAlert('Failed to delete device', 'error')
    });
  }

  // ==========================================
  // ACCESS CONTROL OPERATIONS
  // ==========================================

  openGrantAccessModal() {
    this.grantFormData = {
      user_id: this.selectedUser ? this.selectedUser.id : 2,
      device_id: this.devices.length > 0 ? this.devices[0].id : (this.allDevices[0]?.id || 8),
      can_view_messages: true,
      can_delete_messages: true,
      can_receive_notifications: true,
      can_send_sms: false
    };
    this.showGrantAccessModal = true;
  }

  closeGrantAccessModal() {
    this.showGrantAccessModal = false;
  }

  submitGrantAccess() {
    this.saving = true;
    const uid = this.selectedUser ? this.selectedUser.id : 2;

    this.api.grantUserAccess(uid, {
      target_user_id: this.grantFormData.user_id,
      device_id: this.grantFormData.device_id,
      can_view_messages: this.grantFormData.can_view_messages,
      can_delete_messages: this.grantFormData.can_delete_messages,
      can_receive_notifications: this.grantFormData.can_receive_notifications,
      can_send_sms: this.grantFormData.can_send_sms
    }).subscribe({
      next: () => {
        this.saving = false;
        this.closeGrantAccessModal();
        this.showAlert('Device access permissions granted', 'success');
        this.loadUserAccess();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.error || 'Failed to grant access', 'error');
      }
    });
  }

  toggleAccessPermission(acc: SmsUserDeviceAccess, field: 'can_view_messages' | 'can_delete_messages' | 'can_receive_notifications' | 'can_send_sms') {
    (acc as any)[field] = !(acc as any)[field];
    this.api.updateSmsDeviceAccess(acc.id, {
      can_view_messages: !!acc.can_view_messages,
      can_delete_messages: !!acc.can_delete_messages,
      can_receive_notifications: !!acc.can_receive_notifications,
      can_send_sms: !!acc.can_send_sms
    }).subscribe({
      next: () => this.showAlert('Permission updated', 'success'),
      error: () => this.showAlert('Failed to update permission', 'error')
    });
  }

  revokeAccess(acc: SmsUserDeviceAccess) {
    if (!confirm('Revoke access privilege?')) return;
    this.api.revokeSmsDeviceAccess(acc.id).subscribe({
      next: () => {
        this.showAlert('Access revoked', 'success');
        this.loadUserAccess();
      },
      error: () => this.showAlert('Failed to revoke access', 'error')
    });
  }

  // ==========================================
  // NOTIFICATIONS & FCM TOKENS
  // ==========================================

  retryNotification(n: SmsNotification) {
    this.api.retrySmsNotification(n.id).subscribe({
      next: () => {
        n.delivery_status = 'sent';
        this.showAlert('Notification retry dispatched', 'success');
      },
      error: () => this.showAlert('Failed to retry notification', 'error')
    });
  }

  toggleFcmToken(tok: SmsUserFcmToken) {
    const nextVal = !tok.is_active;
    this.api.toggleSmsFcmToken(tok.id, nextVal).subscribe({
      next: () => {
        tok.is_active = nextVal;
        this.showAlert(`Token status set to ${nextVal ? 'active' : 'inactive'}`, 'success');
        this.loadSmsUsers();
      },
      error: () => this.showAlert('Failed to toggle token state', 'error')
    });
  }

  deleteFcmToken(tok: SmsUserFcmToken) {
    if (!confirm('Remove this FCM push token?')) return;
    this.api.deleteSmsFcmToken(tok.id).subscribe({
      next: () => {
        this.showAlert('Token removed', 'success');
        this.loadUserFcmTokens();
        this.loadSmsUsers();
      },
      error: () => this.showAlert('Failed to remove token', 'error')
    });
  }

  clearAllLogs() {
    if (!confirm('Clear all raw system telemetry logs?')) return;
    this.api.clearSmsLogs().subscribe({
      next: () => {
        this.showAlert('Logs cleared', 'success');
        this.loadLogs();
      },
      error: () => this.showAlert('Failed to clear logs', 'error')
    });
  }

  // ==========================================
  // USER CREATION & MANAGEMENT
  // ==========================================

  openAddUserModal() {
    this.userFormData = {
      name: '',
      email: '',
      user_type: 'child',
      is_admin: false
    };
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
  }

  submitSmsUser() {
    if (!this.userFormData.email) {
      this.showAlert('Email is required', 'error');
      return;
    }
    this.saving = true;
    this.api.createSmsUser(this.userFormData).subscribe({
      next: () => {
        this.saving = false;
        this.closeUserModal();
        this.showAlert('User created successfully', 'success');
        this.loadSmsUsers();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.error || 'Failed to create user', 'error');
      }
    });
  }

  // ==========================================
  // PRESENTATION HELPERS
  // ==========================================

  getUserAvatar(userType?: string): string {
    switch (userType) {
      case 'parent': return '👨‍🦳';
      case 'admin': return '🛡️';
      default: return '👤';
    }
  }

  formatUserType(userType?: string): string {
    switch (userType) {
      case 'parent': return 'Parent / Phone Owner';
      case 'admin': return 'Admin / Monitor';
      default: return 'Family Member';
    }
  }

  getUserTypeBadge(userType?: string): string {
    switch (userType) {
      case 'parent': return 'badge-success';
      case 'admin': return 'badge-primary';
      default: return 'badge-secondary';
    }
  }

  getSenderIcon(type?: string): string {
    switch (type) {
      case 'OTP': return '🔑';
      case 'Bank Credit': return '💰';
      case 'Bank Debit': return '💳';
      case 'Bill Alert': return '⚡';
      case 'Telecom': return '📶';
      default: return '💬';
    }
  }

  getSenderClass(sender: string, type?: string): string {
    switch (type) {
      case 'OTP': return 'bubble-otp';
      case 'Bank Credit':
      case 'Bank Debit': return 'bubble-bank';
      case 'Bill Alert': return 'bubble-bill';
      case 'Telecom': return 'bubble-telecom';
      default: return '';
    }
  }

  getTypeBadgeClass(type?: string): string {
    switch (type) {
      case 'OTP': return 'badge-warning';
      case 'Bank Credit': return 'badge-success';
      case 'Bank Debit': return 'badge-danger';
      case 'Bill Alert': return 'badge-danger';
      case 'Telecom': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  private showAlert(msg: string, type: 'success' | 'error') {
    this.alertMessage = msg;
    this.alertType = type;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.alertMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }
}
