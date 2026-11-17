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
              <h2 class="panel-title">Dad's Phone & SMS Gateway Monitor</h2>
              <p class="panel-subtitle">
                Centralized telemetry command center for Dad's phone (Samsung Galaxy), live SMS ingestion, banking OTPs & push notifications
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

      <!-- Telemetry KPI Metrics Grid -->
      @if (overview) {
        <div class="telemetry-grid">
          <!-- Card 1: Paired Devices -->
          <div class="telemetry-card">
            <div class="card-top">
              <span class="card-icon">📱</span>
              <span class="card-label">Paired Phones</span>
            </div>
            <div class="card-value text-primary">
              {{ overview.devices.total }}
              <span class="sub-val text-success">({{ overview.devices.active }} Active)</span>
            </div>
            <div class="card-footer">
              <span>Primary: <strong>{{ overview.devices.latest?.device_name || "Dad's Phone" }}</strong></span>
            </div>
          </div>

          <!-- Card 2: Total Messages -->
          <div class="telemetry-card">
            <div class="card-top">
              <span class="card-icon">📩</span>
              <span class="card-label">Total SMS Logged</span>
            </div>
            <div class="card-value text-warning">
              {{ overview.messages.total }}
              @if (overview.messages.unread > 0) {
                <span class="badge badge-danger unread-pill">{{ overview.messages.unread }} Unread</span>
              }
            </div>
            <div class="card-footer">
              <span><strong>{{ overview.messages.today }}</strong> received today • <strong>{{ overview.messages.last24h }}</strong> in 24h</span>
            </div>
          </div>

          <!-- Card 3: Bank & OTPs -->
          <div class="telemetry-card">
            <div class="card-top">
              <span class="card-icon">🔑</span>
              <span class="card-label">Recent OTPs & Bank</span>
            </div>
            <div class="card-value text-success">
              {{ overview.messages.recentOtpCount }}
              <span class="sub-val">OTPs in 48h</span>
            </div>
            <div class="card-footer">
              <span>Instant OTP extraction & 1-click clipboard</span>
            </div>
          </div>

          <!-- Card 4: Push Notifications -->
          <div class="telemetry-card">
            <div class="card-top">
              <span class="card-icon">🔔</span>
              <span class="card-label">Push Dispatches</span>
            </div>
            <div class="card-value text-info">
              {{ overview.notifications.deliveryRate }}%
              <span class="sub-val">Success Rate</span>
            </div>
            <div class="card-footer">
              <span>{{ overview.notifications.sent }} sent • {{ overview.notifications.failed }} failed</span>
            </div>
          </div>

          <!-- Card 5: Active Permissions & FCM -->
          <div class="telemetry-card">
            <div class="card-top">
              <span class="card-icon">🔐</span>
              <span class="card-label">Access & FCM Tokens</span>
            </div>
            <div class="card-value text-primary">
              {{ overview.accessGrants }}
              <span class="sub-val">Grants</span>
            </div>
            <div class="card-footer">
              <span>{{ overview.fcm.active }} active device FCM tokens linked</span>
            </div>
          </div>
        </div>
      }

      <!-- Sub Navigation Bar -->
      <div class="sub-nav-bar">
        <button 
          class="sub-nav-btn" 
          [class.active]="activeSubTab === 'messages'" 
          (click)="switchSubTab('messages')">
          <span>📩 Live SMS & OTPs</span>
          <span class="count-pill">{{ messages.length }}</span>
        </button>
        <button 
          class="sub-nav-btn" 
          [class.active]="activeSubTab === 'devices'" 
          (click)="switchSubTab('devices')">
          <span>📲 Paired Devices (sms_devices)</span>
          <span class="count-pill">{{ devices.length }}</span>
        </button>
        <button 
          class="sub-nav-btn" 
          [class.active]="activeSubTab === 'notifications'" 
          (click)="switchSubTab('notifications')">
          <span>🔔 Push Notifications & Logs (sms_notifications)</span>
          <span class="count-pill">{{ notifications.length }}</span>
        </button>
        <button 
          class="sub-nav-btn" 
          [class.active]="activeSubTab === 'access'" 
          (click)="switchSubTab('access')">
          <span>🔐 Device Access Matrix (sms_user_device_access)</span>
          <span class="count-pill">{{ accessList.length }}</span>
        </button>
        <button 
          class="sub-nav-btn" 
          [class.active]="activeSubTab === 'users'" 
          (click)="switchSubTab('users')">
          <span>👥 Gateway Users & FCM (sms_users, sms_fcm)</span>
          <span class="count-pill">{{ smsUsers.length }}</span>
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- SUB-TAB 1: 📩 LIVE SMS MESSAGES & OTP LOGS -->
      <!-- ======================================================== -->
      @if (activeSubTab === 'messages') {
        <div class="tab-pane fade-in">
          <!-- Filters Toolbar -->
          <div class="card filter-toolbar">
            <div class="filter-row">
              <!-- Search query -->
              <div class="filter-col flex-2">
                <label class="form-label-xs">🔍 Search Messages & Senders</label>
                <input 
                  type="text" 
                  class="form-control form-control-sm" 
                  placeholder="Search HDFC, SBI, OTP, bill, amount..." 
                  [(ngModel)]="searchQuery" 
                  (input)="applyMessageFilters()">
              </div>

              <!-- Device filter -->
              <div class="filter-col">
                <label class="form-label-xs">📱 Device</label>
                <select class="form-control form-control-sm" [(ngModel)]="filterDeviceId" (change)="loadMessages()">
                  <option value="all">All Devices</option>
                  @for (dev of devices; track dev.id) {
                    <option [value]="dev.id">{{ dev.device_name }}</option>
                  }
                </select>
              </div>

              <!-- Type filter -->
              <div class="filter-col">
                <label class="form-label-xs">🏷️ Message Type</label>
                <select class="form-control form-control-sm" [(ngModel)]="filterType" (change)="applyMessageFilters()">
                  <option value="all">All Types</option>
                  <option value="OTP">OTP Verification</option>
                  <option value="Bank Credit">Bank Credit</option>
                  <option value="Bank Debit">Bank Debit</option>
                  <option value="Bill Alert">Bill Alert</option>
                  <option value="Telecom">Telecom</option>
                </select>
              </div>

              <!-- Read status -->
              <div class="filter-col">
                <label class="form-label-xs">Status</label>
                <select class="form-control form-control-sm" [(ngModel)]="filterReadStatus" (change)="applyMessageFilters()">
                  <option value="all">All Messages</option>
                  <option value="0">Unread Only</option>
                  <option value="1">Read Only</option>
                </select>
              </div>

              <!-- Quick action -->
              <div class="filter-col action-col">
                <label class="form-label-xs">&nbsp;</label>
                <button class="btn btn-secondary btn-sm" (click)="markAllAsRead()" title="Mark all messages as read">
                  <span>Mark All Read</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Messages Stream Cards -->
          @if (filteredMessages.length === 0) {
            <div class="card empty-stream-card">
              <span class="empty-emoji">📭</span>
              <h3>No SMS Messages Found</h3>
              <p class="text-muted">No messages match your search criteria. Ingest a test message or check device sync.</p>
              <button class="btn btn-primary btn-sm mt-3" (click)="openSimulateModal()">
                <span>➕ Ingest Test SMS</span>
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
                        <span class="device-tag">📱 {{ msg.device_name }} ({{ msg.device_phone || 'SIM 1' }})</span>
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
          }
        </div>
      }

      <!-- ======================================================== -->
      <!-- SUB-TAB 2: 📲 PAIRED DEVICES (sms_devices) -->
      <!-- ======================================================== -->
      @if (activeSubTab === 'devices') {
        <div class="tab-pane fade-in">
          <div class="content-bar-sub">
            <div>
              <h3>Paired Android Phones (sms_devices)</h3>
              <p class="text-muted">Android gateway phones running the background SMS forwarding microservice daemon</p>
            </div>
            <button class="btn btn-primary" (click)="openAddDeviceModal()">
              <span>➕ Register New Phone</span>
            </button>
          </div>

          <div class="devices-grid">
            @for (dev of devices; track dev.id) {
              <div class="card device-card">
                <div class="device-card-header">
                  <div class="device-brand-row">
                    <span class="device-icon">📱</span>
                    <div>
                      <h4 class="device-name">{{ dev.device_name }}</h4>
                      <span class="device-phone">{{ dev.phone_number || 'No SIM Phone Number' }}</span>
                    </div>
                  </div>
                  <span class="status-indicator-badge live-badge">🟢 Connected</span>
                </div>

                <div class="device-stats-grid">
                  <div class="device-stat">
                    <span class="stat-lbl">Total SMS</span>
                    <strong class="stat-num">{{ dev.total_messages || 0 }}</strong>
                  </div>
                  <div class="device-stat">
                    <span class="stat-lbl">Unread</span>
                    <strong class="stat-num text-danger">{{ dev.unread_messages || 0 }}</strong>
                  </div>
                  <div class="device-stat">
                    <span class="stat-lbl">Access Grants</span>
                    <strong class="stat-num text-primary">{{ dev.authorized_users_count || 0 }}</strong>
                  </div>
                </div>

                <div class="device-meta-row">
                  <span>Owner: <strong>{{ dev.owner_name || 'Dad' }}</strong></span>
                  <span class="text-xs text-muted">Registered: {{ dev.created_at | date:'dd MMM yyyy' }}</span>
                </div>

                <div class="device-card-actions">
                  <button class="btn btn-secondary btn-sm flex-1" (click)="openEditDeviceModal(dev)">
                    ✏️ Edit
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="deleteDevice(dev)">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- SUB-TAB 3: 🔔 PUSH NOTIFICATIONS & RAW TELEMETRY LOGS -->
      <!-- ======================================================== -->
      @if (activeSubTab === 'notifications') {
        <div class="tab-pane fade-in">
          <div class="notifications-section">
            <div class="content-bar-sub">
              <div>
                <h3>Push Notification Dispatch Logs (sms_notifications)</h3>
                <p class="text-muted">Push notification attempts triggered when SMS arrives on Dad's phone</p>
              </div>
            </div>

            <div class="card p-0 mb-4">
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width: 80px;">ID</th>
                      <th>Recipient User</th>
                      <th>Sender</th>
                      <th>Message Snippet</th>
                      <th>Status</th>
                      <th>Dispatched At</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (n of notifications; track n.id) {
                      <tr>
                        <td>#{{ n.id }}</td>
                        <td>
                          <strong>{{ n.user_name || 'Admin' }}</strong>
                          <span class="d-block text-xs text-muted">{{ n.user_email }}</span>
                        </td>
                        <td>
                          <span class="badge badge-secondary">{{ n.msg_sender }}</span>
                        </td>
                        <td>
                          <span class="snippet-text">{{ n.msg_content }}</span>
                        </td>
                        <td>
                          <span 
                            class="badge" 
                            [ngClass]="n.delivery_status === 'sent' ? 'badge-success' : (n.delivery_status === 'failed' ? 'badge-danger' : 'badge-warning')">
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

            <!-- Raw System Logs (sms_log) -->
            <div class="content-bar-sub mt-4">
              <div>
                <h3>System Telemetry & Synchronization Logs (sms_log)</h3>
                <p class="text-muted">Microservice daemon heartbeat and incoming batch ingestion logs</p>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="clearAllLogs()">
                🗑️ Clear Logs
              </button>
            </div>

            <div class="card p-0">
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width: 90px;">Log ID</th>
                      <th style="width: 220px;">Event Title</th>
                      <th>Telemetry Payload / Description</th>
                      <th style="width: 180px;">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (log of smsLogs; track log.id) {
                      <tr>
                        <td>#{{ log.id }}</td>
                        <td>
                          <strong class="text-primary">{{ log.title }}</strong>
                        </td>
                        <td>
                          <code class="log-message-code">{{ log.message }}</code>
                        </td>
                        <td>
                          <span class="text-xs text-muted">{{ log.inserted_at | date:'dd MMM yyyy, hh:mm:ss a' }}</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- SUB-TAB 4: 🔐 ACCESS MATRIX (sms_user_device_access) -->
      <!-- ======================================================== -->
      @if (activeSubTab === 'access') {
        <div class="tab-pane fade-in">
          <div class="content-bar-sub">
            <div>
              <h3>Device Access Privileges (sms_user_device_access)</h3>
              <p class="text-muted">Control who can read Dad's SMS, delete messages, receive push notifications, or dispatch SMS</p>
            </div>
            <button class="btn btn-primary" (click)="openGrantAccessModal()">
              <span>➕ Grant Device Access</span>
            </button>
          </div>

          <div class="access-grid">
            @for (acc of accessList; track acc.id) {
              <div class="card access-card">
                <div class="access-card-head">
                  <div class="user-info-box">
                    <span class="user-avatar-circle">👤</span>
                    <div>
                      <strong class="user-access-name">{{ acc.user_name }}</strong>
                      <span class="user-access-email">{{ acc.user_email }}</span>
                      <span class="badge badge-info text-xs">{{ acc.user_type | uppercase }}</span>
                    </div>
                  </div>
                  <div class="device-target-box">
                    <span class="text-xs text-muted">Target Phone:</span>
                    <strong>📱 {{ acc.device_name }}</strong>
                  </div>
                </div>

                <div class="permissions-switch-list">
                  <!-- View Messages -->
                  <label class="permission-toggle">
                    <input 
                      type="checkbox" 
                      [checked]="acc.can_view_messages" 
                      (change)="togglePermission(acc, 'can_view_messages', $event)">
                    <span class="switch-slider"></span>
                    <span class="perm-title">👁️ View Messages</span>
                  </label>

                  <!-- Receive Notifications -->
                  <label class="permission-toggle">
                    <input 
                      type="checkbox" 
                      [checked]="acc.can_receive_notifications" 
                      (change)="togglePermission(acc, 'can_receive_notifications', $event)">
                    <span class="switch-slider"></span>
                    <span class="perm-title">🔔 Push Notifications</span>
                  </label>

                  <!-- Delete Messages -->
                  <label class="permission-toggle">
                    <input 
                      type="checkbox" 
                      [checked]="acc.can_delete_messages" 
                      (change)="togglePermission(acc, 'can_delete_messages', $event)">
                    <span class="switch-slider"></span>
                    <span class="perm-title">🗑️ Delete Messages</span>
                  </label>

                  <!-- Send SMS -->
                  <label class="permission-toggle">
                    <input 
                      type="checkbox" 
                      [checked]="acc.can_send_sms" 
                      (change)="togglePermission(acc, 'can_send_sms', $event)">
                    <span class="switch-slider"></span>
                    <span class="perm-title">📤 Send SMS</span>
                  </label>
                </div>

                <div class="access-footer">
                  <span class="text-xs text-muted">Granted by: {{ acc.granted_by_name || 'Admin' }}</span>
                  <button class="btn btn-sm btn-danger" (click)="revokeAccess(acc)">
                    Revoke Access
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- SUB-TAB 5: 👥 USERS & FCM TOKENS -->
      <!-- ======================================================== -->
      @if (activeSubTab === 'users') {
        <div class="tab-pane fade-in">
          <!-- SMS Users -->
          <div class="content-bar-sub">
            <div>
              <h3>SMS Microservice Users (sms_users)</h3>
              <p class="text-muted">Parents, children and administrator accounts registered on the SMS Gateway</p>
            </div>
            <button class="btn btn-primary" (click)="openAddUserModal()">
              <span>➕ Add Gateway User</span>
            </button>
          </div>

          <div class="card p-0 mb-4">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>User Type</th>
                    <th>Admin Role</th>
                    <th>Devices Owned</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of smsUsers; track u.id) {
                    <tr>
                      <td>#{{ u.id }}</td>
                      <td>
                        <strong>{{ u.name || 'Anonymous' }}</strong>
                      </td>
                      <td>{{ u.email }}</td>
                      <td>
                        <span class="badge" [ngClass]="u.user_type === 'parent' ? 'badge-warning' : (u.user_type === 'admin' ? 'badge-primary' : 'badge-secondary')">
                          {{ u.user_type | uppercase }}
                        </span>
                      </td>
                      <td>
                        @if (u.is_admin) {
                          <span class="badge badge-success">ADMIN</span>
                        } @else {
                          <span class="text-muted text-xs">Standard</span>
                        }
                      </td>
                      <td>{{ u.devices_owned || 0 }} phones</td>
                      <td style="text-align: right;">
                        <button class="btn btn-sm btn-danger" (click)="deleteSmsUser(u)">
                          Delete
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- FCM Tokens -->
          <div class="content-bar-sub mt-4">
            <div>
              <h3>FCM Push Notification Tokens (sms_user_fcm_tokens)</h3>
              <p class="text-muted">Registered Firebase Cloud Messaging device tokens for instant push alerts</p>
            </div>
          </div>

          <div class="card p-0">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Token ID</th>
                    <th>User</th>
                    <th>Device Type</th>
                    <th>Token Key</th>
                    <th>Active</th>
                    <th>Last Used</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tok of fcmTokens; track tok.id) {
                    <tr>
                      <td>#{{ tok.id }}</td>
                      <td>
                        <strong>{{ tok.user_name || 'Admin User' }}</strong>
                        <span class="d-block text-xs text-muted">{{ tok.user_email }}</span>
                      </td>
                      <td>
                        <span class="badge badge-info">{{ tok.device_type || 'Android' }}</span>
                      </td>
                      <td>
                        <code class="token-preview" [title]="tok.fcm_token">{{ tok.fcm_token.slice(0, 36) }}...</code>
                      </td>
                      <td>
                        <button 
                          class="badge" 
                          [ngClass]="tok.is_active ? 'badge-success' : 'badge-secondary'"
                          (click)="toggleFcmToken(tok)" 
                          style="cursor: pointer; border: none;">
                          {{ tok.is_active ? 'ACTIVE' : 'INACTIVE' }}
                        </button>
                      </td>
                      <td>{{ tok.last_used_at ? (tok.last_used_at | date:'dd MMM, hh:mm a') : 'Never' }}</td>
                      <td style="text-align: right;">
                        <button class="btn btn-sm btn-danger" (click)="deleteFcmToken(tok)">
                          Remove
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL 1: ➕ SIMULATE / INGEST INCOMING SMS -->
      <!-- ======================================================== -->
      @if (showSimulateModal) {
        <div class="modal-overlay" (click)="closeSimulateModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>➕ Ingest / Simulate SMS to Dad's Phone</h3>
              <button class="close-btn" (click)="closeSimulateModal()">&times;</button>
            </div>
            <div class="modal-body">
              <!-- Quick Presets -->
              <div class="presets-row">
                <span class="text-xs font-bold text-muted">Quick Templates:</span>
                <button type="button" class="preset-pill" (click)="applySmsPreset('hdfc')">🏦 HDFC Bank</button>
                <button type="button" class="preset-pill" (click)="applySmsPreset('sbi_otp')">🔑 SBI OTP</button>
                <button type="button" class="preset-pill" (click)="applySmsPreset('gpay')">🌐 GPay OTP</button>
                <button type="button" class="preset-pill" (click)="applySmsPreset('tneb')">⚡ TNEB Bill</button>
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Target Phone Device</label>
                <select class="form-control" [(ngModel)]="simulateFormData.device_id">
                  @for (d of devices; track d.id) {
                    <option [value]="d.id">{{ d.device_name }} ({{ d.phone_number }})</option>
                  }
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Sender ID / Phone</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="e.g., VK-HDFCBK, AX-SBINB, VM-TNEBL..." 
                  [(ngModel)]="simulateFormData.sender">
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">SMS Content</label>
                <textarea 
                  class="form-control" 
                  rows="4" 
                  placeholder="Paste or enter SMS message body..." 
                  [(ngModel)]="simulateFormData.message">
                </textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeSimulateModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitSimulateSms()" [disabled]="saving">
                {{ saving ? 'Ingesting...' : 'Ingest Message' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL 2: 📱 REGISTER / EDIT DEVICE -->
      <!-- ======================================================== -->
      @if (showDeviceModal) {
        <div class="modal-overlay" (click)="closeDeviceModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditingDevice ? '✏️ Edit Phone Device' : '➕ Register New Phone Device' }}</h3>
              <button class="close-btn" (click)="closeDeviceModal()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label required">Device Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="e.g., Dad's Galaxy S23, Dad's Pixel 7..." 
                  [(ngModel)]="deviceFormData.device_name">
              </div>

              <div class="form-group mb-3">
                <label class="form-label">SIM Phone Number</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="+91 98401 23456" 
                  [(ngModel)]="deviceFormData.phone_number">
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Device Owner</label>
                <select class="form-control" [(ngModel)]="deviceFormData.owner_id">
                  @for (u of smsUsers; track u.id) {
                    <option [value]="u.id">{{ u.name || u.email }} ({{ u.user_type }})</option>
                  }
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDeviceModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitDevice()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Device' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL 3: 🔐 GRANT DEVICE ACCESS -->
      <!-- ======================================================== -->
      @if (showGrantAccessModal) {
        <div class="modal-overlay" (click)="closeGrantAccessModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>🔐 Grant Device Access Privileges</h3>
              <button class="close-btn" (click)="closeGrantAccessModal()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label required">Select User</label>
                <select class="form-control" [(ngModel)]="grantFormData.user_id">
                  @for (u of smsUsers; track u.id) {
                    <option [value]="u.id">{{ u.name }} ({{ u.email }})</option>
                  }
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Select Target Phone Device</label>
                <select class="form-control" [(ngModel)]="grantFormData.device_id">
                  @for (d of devices; track d.id) {
                    <option [value]="d.id">{{ d.device_name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Granted Permissions</label>
                <div class="perm-checkbox-list">
                  <label class="form-check-label">
                    <input type="checkbox" [(ngModel)]="grantFormData.can_view_messages">
                    <span>👁️ Can View Messages</span>
                  </label>
                  <label class="form-check-label">
                    <input type="checkbox" [(ngModel)]="grantFormData.can_receive_notifications">
                    <span>🔔 Can Receive Push Notifications</span>
                  </label>
                  <label class="form-check-label">
                    <input type="checkbox" [(ngModel)]="grantFormData.can_delete_messages">
                    <span>🗑️ Can Delete Messages</span>
                  </label>
                  <label class="form-check-label">
                    <input type="checkbox" [(ngModel)]="grantFormData.can_send_sms">
                    <span>📤 Can Send SMS via Gateway</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeGrantAccessModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitGrantAccess()" [disabled]="saving">
                {{ saving ? 'Granting...' : 'Grant Access' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL 4: 👤 ADD GATEWAY USER -->
      <!-- ======================================================== -->
      @if (showUserModal) {
        <div class="modal-overlay" (click)="closeUserModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>➕ Add SMS Gateway User</h3>
              <button class="close-btn" (click)="closeUserModal()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" placeholder="e.g., Dad, Brother, Veera" [(ngModel)]="userFormData.name">
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Email Address</label>
                <input type="email" class="form-control" placeholder="user@familyphone.com" [(ngModel)]="userFormData.email">
              </div>

              <div class="form-group mb-3">
                <label class="form-label">User Type</label>
                <select class="form-control" [(ngModel)]="userFormData.user_type">
                  <option value="parent">Parent (Phone Owner)</option>
                  <option value="child">Child (Family Member)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div class="form-check-group">
                <label class="form-check-label">
                  <input type="checkbox" [(ngModel)]="userFormData.is_admin">
                  <span>Is Gateway Administrator</span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeUserModal()">Cancel</button>
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
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Header Strip */
    .panel-header-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.25rem;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 15px rgba(49, 46, 129, 0.25);
    }
    .header-title-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .telemetry-icon {
      font-size: 2rem;
    }
    .panel-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }
    .panel-subtitle {
      font-size: 0.825rem;
      color: #c7d2fe;
      margin: 0.2rem 0 0 0;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .daemon-pill {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      padding: 0.35rem 0.85rem;
      font-size: 0.75rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      color: #a7f3d0;
    }
    .live-pulse {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Telemetry KPI Cards */
    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .telemetry-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.1rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .telemetry-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .card-top {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 0.4rem;
    }
    .card-value {
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.1;
      display: flex;
      align-items: baseline;
      gap: 0.45rem;
      margin-bottom: 0.4rem;
    }
    .sub-val {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .unread-pill {
      font-size: 0.7rem;
      padding: 2px 6px;
    }
    .card-footer {
      font-size: 0.725rem;
      color: var(--text-light);
    }

    /* Sub Navigation Bar */
    .sub-nav-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 1.5rem;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .sub-nav-btn {
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      padding: 0.65rem 1rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .sub-nav-btn:hover {
      color: var(--primary);
    }
    .sub-nav-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .count-pill {
      background: var(--bg-card-subtle);
      color: var(--text-muted);
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: var(--radius-full);
    }

    /* Filter Toolbar */
    .filter-toolbar {
      padding: 0.85rem 1.25rem;
      margin-bottom: 1.25rem;
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

    /* Message Body Text */
    .message-body-text {
      font-size: 0.885rem;
      line-height: 1.45;
      color: #1e293b;
      background: #f8fafc;
      padding: 0.65rem 0.85rem;
      border-radius: 6px;
      font-family: inherit;
    }

    /* Card Footer Actions */
    .message-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px dashed var(--border-color);
      padding-top: 0.5rem;
    }
    .read-toggle-btn {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
    }
    .read-toggle-btn.read {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }
    .icon-action-btn {
      background: none;
      border: none;
      font-size: 0.775rem;
      cursor: pointer;
      color: var(--text-muted);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
    .delete-btn:hover {
      color: var(--danger);
      background: #fee2e2;
    }

    /* Devices Grid */
    .content-bar-sub {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
      font-size: 1.85rem;
    }
    .device-name {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }
    .device-phone {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .device-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      background: #f8fafc;
      padding: 0.65rem;
      border-radius: var(--radius-sm);
      text-align: center;
    }
    .stat-lbl {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      display: block;
    }
    .stat-num {
      font-size: 1.1rem;
    }
    .device-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.775rem;
    }
    .device-card-actions {
      display: flex;
      gap: 0.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
    }

    /* Access Matrix Cards */
    .access-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .access-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .access-card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .user-info-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .user-avatar-circle {
      font-size: 1.5rem;
    }
    .user-access-name {
      display: block;
      font-size: 0.95rem;
    }
    .user-access-email {
      display: block;
      font-size: 0.725rem;
      color: var(--text-muted);
    }
    .device-target-box {
      text-align: right;
    }
    .permissions-switch-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .permission-toggle {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .access-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 0.6rem;
    }

    /* Modal Styling */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1200;
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
      max-width: 540px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalPop {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
    }

    /* Presets Strip */
    .presets-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      background: var(--bg-card-subtle);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
    }
    .preset-pill {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .preset-pill:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: var(--primary-light);
    }
    .log-message-code {
      font-size: 0.75rem;
      color: #334155;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      word-break: break-all;
    }
    .token-preview {
      font-size: 0.75rem;
      color: #0284c7;
    }
    .snippet-text {
      font-size: 0.8rem;
      color: var(--text-main);
      display: block;
      max-width: 320px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .empty-stream-card {
      text-align: center;
      padding: 3rem 1.5rem;
    }
    .empty-emoji {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    .perm-checkbox-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      background: #f8fafc;
      padding: 0.85rem;
      border-radius: 6px;
      margin-top: 0.35rem;
    }
  `]
})
export class SmsGatewayPanelComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  activeSubTab: 'messages' | 'devices' | 'notifications' | 'access' | 'users' = 'messages';

  overview: SmsGatewayOverview | null = null;
  messages: SmsMessage[] = [];
  filteredMessages: SmsMessage[] = [];
  devices: SmsDevice[] = [];
  notifications: SmsNotification[] = [];
  accessList: SmsUserDeviceAccess[] = [];
  smsUsers: SmsUser[] = [];
  fcmTokens: SmsUserFcmToken[] = [];
  smsLogs: SmsLog[] = [];

  // Filter States
  searchQuery = '';
  filterDeviceId = 'all';
  filterType = 'all';
  filterReadStatus = 'all';

  loading = false;
  saving = false;
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';

  // Modals
  showSimulateModal = false;
  simulateFormData = {
    device_id: 1,
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
    owner_id: 1,
    owner_name: ''
  };

  showGrantAccessModal = false;
  grantFormData = {
    user_id: 1,
    device_id: 1,
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

  switchSubTab(tab: 'messages' | 'devices' | 'notifications' | 'access' | 'users') {
    this.activeSubTab = tab;
    if (tab === 'messages') this.loadMessages();
    else if (tab === 'devices') this.loadDevices();
    else if (tab === 'notifications') {
      this.loadNotifications();
      this.loadLogs();
    } else if (tab === 'access') this.loadAccess();
    else if (tab === 'users') {
      this.loadSmsUsers();
      this.loadFcmTokens();
    }
  }

  refreshAll() {
    this.loading = true;
    this.loadOverview();
    this.loadDevices();
    this.loadMessages();
    this.loadNotifications();
    this.loadAccess();
    this.loadSmsUsers();
    this.loadFcmTokens();
    this.loadLogs();
  }

  loadOverview() {
    this.api.getSmsOverview().subscribe({
      next: (res) => {
        if (res.success) this.overview = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load SMS overview:', err)
    });
  }

  loadMessages() {
    this.api.getSmsMessages({ device_id: this.filterDeviceId }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.messages = res.data;
          this.applyMessageFilters();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load SMS messages:', err);
      }
    });
  }

  loadDevices() {
    this.api.getSmsDevices().subscribe({
      next: (res) => {
        if (res.success) {
          this.devices = res.data;
          if (this.devices.length > 0 && !this.simulateFormData.device_id) {
            this.simulateFormData.device_id = this.devices[0].id;
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load SMS devices:', err)
    });
  }

  loadNotifications() {
    this.api.getSmsNotifications().subscribe({
      next: (res) => {
        if (res.success) this.notifications = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load notifications:', err)
    });
  }

  loadAccess() {
    this.api.getSmsDeviceAccess().subscribe({
      next: (res) => {
        if (res.success) this.accessList = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load device access:', err)
    });
  }

  loadSmsUsers() {
    this.api.getSmsUsers().subscribe({
      next: (res) => {
        if (res.success) this.smsUsers = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load SMS users:', err)
    });
  }

  loadFcmTokens() {
    this.api.getSmsFcmTokens().subscribe({
      next: (res) => {
        if (res.success) this.fcmTokens = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load FCM tokens:', err)
    });
  }

  loadLogs() {
    this.api.getSmsLogs().subscribe({
      next: (res) => {
        if (res.success) this.smsLogs = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load SMS logs:', err)
    });
  }

  applyMessageFilters() {
    let result = [...this.messages];

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(m => 
        m.sender.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        (m.otp_code && m.otp_code.includes(q))
      );
    }

    if (this.filterType !== 'all') {
      result = result.filter(m => m.inferred_type === this.filterType);
    }

    if (this.filterReadStatus !== 'all') {
      const isRead = parseInt(this.filterReadStatus, 10) === 1;
      result = result.filter(m => Boolean(m.is_read) === isRead);
    }

    this.filteredMessages = result;
  }

  // ==========================================
  // MESSAGE INTERACTIONS & OTP COPY
  // ==========================================

  copyToClipboard(text: string, msg: SmsMessage) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        msg.copied = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          msg.copied = false;
          this.cdr.markForCheck();
        }, 2500);
      });
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      msg.copied = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        msg.copied = false;
        this.cdr.markForCheck();
      }, 2500);
    }
  }

  toggleReadStatus(msg: SmsMessage) {
    const newStatus = !msg.is_read;
    this.api.toggleSmsMessageRead(msg.id, newStatus).subscribe({
      next: () => {
        msg.is_read = newStatus;
        if (this.overview) {
          this.overview.messages.unread += newStatus ? -1 : 1;
        }
        this.cdr.markForCheck();
      },
      error: (err) => this.showAlert('Failed to update read status', 'error')
    });
  }

  markAllAsRead() {
    this.api.markAllSmsRead().subscribe({
      next: (res) => {
        this.showAlert(res.message, 'success');
        this.loadMessages();
        this.loadOverview();
      },
      error: (err) => this.showAlert('Failed to mark all as read', 'error')
    });
  }

  deleteMessage(msg: SmsMessage) {
    if (!confirm(`Delete message from "${msg.sender}"?`)) return;
    this.api.deleteSmsMessage(msg.id).subscribe({
      next: () => {
        this.showAlert('Message deleted', 'success');
        this.loadMessages();
        this.loadOverview();
      },
      error: (err) => this.showAlert('Failed to delete message', 'error')
    });
  }

  // ==========================================
  // SIMULATE / INGEST SMS MODAL
  // ==========================================

  openSimulateModal() {
    if (this.devices.length > 0) {
      this.simulateFormData.device_id = this.devices[0].id;
    }
    this.applySmsPreset('sbi_otp');
    this.showSimulateModal = true;
  }

  closeSimulateModal() {
    this.showSimulateModal = false;
  }

  applySmsPreset(presetType: 'hdfc' | 'sbi_otp' | 'gpay' | 'tneb') {
    if (presetType === 'hdfc') {
      this.simulateFormData.sender = 'VK-HDFCBK';
      this.simulateFormData.message = `Dear Customer, INR 4,250.00 credited to your A/c ending 4921 via UPI on ${new Date().toISOString().slice(0, 10)}. Info: UPI/5319827361/Payment. -HDFC Bank`;
      this.simulateFormData.type = 'Bank Credit';
    } else if (presetType === 'sbi_otp') {
      const code = Math.floor(100000 + Math.random() * 900000);
      this.simulateFormData.sender = 'AX-SBINB';
      this.simulateFormData.message = `${code} is your OTP for Net Banking login at State Bank of India. Valid for 5 mins. Never share OTP with anyone.`;
      this.simulateFormData.type = 'OTP';
    } else if (presetType === 'gpay') {
      const code = Math.floor(100000 + Math.random() * 900000);
      this.simulateFormData.sender = 'AX-GPAYIN';
      this.simulateFormData.message = `Your Google Pay verification code is ${code}. Valid for 10 minutes. Never share this code.`;
      this.simulateFormData.type = 'OTP';
    } else if (presetType === 'tneb') {
      this.simulateFormData.sender = 'VM-TNEBL';
      this.simulateFormData.message = 'Dear Consumer 03-12-004-981, Electricity bill of Rs 1,650 for current billing cycle is generated. Due date 28-Nov-2026.';
      this.simulateFormData.type = 'Bill Alert';
    }
  }

  submitSimulateSms() {
    if (!this.simulateFormData.sender || !this.simulateFormData.message) {
      this.showAlert('Sender and message text are required', 'error');
      return;
    }
    this.saving = true;
    this.api.sendSimulatedSms(this.simulateFormData).subscribe({
      next: () => {
        this.saving = false;
        this.closeSimulateModal();
        this.showAlert('SMS message ingested to device feed successfully', 'success');
        this.loadMessages();
        this.loadOverview();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.error || 'Failed to ingest message', 'error');
      }
    });
  }

  // ==========================================
  // DEVICE MANAGEMENT
  // ==========================================

  openAddDeviceModal() {
    this.isEditingDevice = false;
    this.editingDeviceId = null;
    this.deviceFormData = {
      device_name: "Dad's Samsung Galaxy",
      phone_number: '+91 ',
      owner_id: this.smsUsers.length > 0 ? this.smsUsers[0].id : 1,
      owner_name: ''
    };
    this.showDeviceModal = true;
  }

  openEditDeviceModal(dev: SmsDevice) {
    this.isEditingDevice = true;
    this.editingDeviceId = dev.id;
    this.deviceFormData = {
      device_name: dev.device_name,
      phone_number: dev.phone_number || '',
      owner_id: dev.owner_id,
      owner_name: dev.owner_name || ''
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
    if (this.isEditingDevice && this.editingDeviceId) {
      this.api.updateSmsDevice(this.editingDeviceId, this.deviceFormData).subscribe({
        next: () => {
          this.saving = false;
          this.closeDeviceModal();
          this.showAlert('Device updated successfully', 'success');
          this.loadDevices();
          this.loadOverview();
        },
        error: (err) => {
          this.saving = false;
          this.showAlert(err.error?.error || 'Failed to update device', 'error');
        }
      });
    } else {
      this.api.createSmsDevice(this.deviceFormData).subscribe({
        next: () => {
          this.saving = false;
          this.closeDeviceModal();
          this.showAlert('Phone device registered successfully', 'success');
          this.loadDevices();
          this.loadOverview();
        },
        error: (err) => {
          this.saving = false;
          this.showAlert(err.error?.error || 'Failed to register device', 'error');
        }
      });
    }
  }

  deleteDevice(dev: SmsDevice) {
    if (!confirm(`Delete device "${dev.device_name}"? All associated message logs will be removed.`)) return;
    this.api.deleteSmsDevice(dev.id).subscribe({
      next: () => {
        this.showAlert('Device deleted', 'success');
        this.loadDevices();
        this.loadMessages();
        this.loadOverview();
      },
      error: (err) => this.showAlert(err.error?.error || 'Failed to delete device', 'error')
    });
  }

  // ==========================================
  // ACCESS PRIVILEGES & SWITCH TOGGLES
  // ==========================================

  togglePermission(acc: SmsUserDeviceAccess, field: 'can_view_messages' | 'can_delete_messages' | 'can_receive_notifications' | 'can_send_sms', event: any) {
    const val = event.target.checked;
    (acc as any)[field] = val;

    this.api.updateSmsDeviceAccess(acc.id, {
      can_view_messages: Boolean(acc.can_view_messages),
      can_delete_messages: Boolean(acc.can_delete_messages),
      can_receive_notifications: Boolean(acc.can_receive_notifications),
      can_send_sms: Boolean(acc.can_send_sms)
    }).subscribe({
      next: () => this.showAlert('Permission updated', 'success'),
      error: (err) => {
        (acc as any)[field] = !val; // rollback
        this.showAlert('Failed to update permission', 'error');
      }
    });
  }

  openGrantAccessModal() {
    this.grantFormData = {
      user_id: this.smsUsers.length > 0 ? this.smsUsers[0].id : 1,
      device_id: this.devices.length > 0 ? this.devices[0].id : 1,
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
    this.api.grantSmsDeviceAccess(this.grantFormData).subscribe({
      next: () => {
        this.saving = false;
        this.closeGrantAccessModal();
        this.showAlert('Device access privileges granted', 'success');
        this.loadAccess();
        this.loadOverview();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.error || 'Failed to grant access', 'error');
      }
    });
  }

  revokeAccess(acc: SmsUserDeviceAccess) {
    if (!confirm(`Revoke access for user "${acc.user_name}" to "${acc.device_name}"?`)) return;
    this.api.revokeSmsDeviceAccess(acc.id).subscribe({
      next: () => {
        this.showAlert('Access revoked', 'success');
        this.loadAccess();
        this.loadOverview();
      },
      error: (err) => this.showAlert(err.error?.error || 'Failed to revoke access', 'error')
    });
  }

  // ==========================================
  // NOTIFICATIONS, LOGS & USERS
  // ==========================================

  retryNotification(n: SmsNotification) {
    this.api.retrySmsNotification(n.id).subscribe({
      next: () => {
        n.delivery_status = 'sent';
        this.showAlert('Notification retry dispatched', 'success');
        this.loadOverview();
      },
      error: (err) => this.showAlert('Failed to retry notification', 'error')
    });
  }

  clearAllLogs() {
    if (!confirm('Clear all raw system telemetry logs?')) return;
    this.api.clearSmsLogs().subscribe({
      next: () => {
        this.showAlert('Logs cleared', 'success');
        this.loadLogs();
      },
      error: (err) => this.showAlert('Failed to clear logs', 'error')
    });
  }

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
        this.loadOverview();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.error || 'Failed to create user', 'error');
      }
    });
  }

  deleteSmsUser(u: SmsUser) {
    if (!confirm(`Delete user "${u.name || u.email}"?`)) return;
    this.api.deleteSmsUser(u.id).subscribe({
      next: () => {
        this.showAlert('User removed', 'success');
        this.loadSmsUsers();
        this.loadOverview();
      },
      error: (err) => this.showAlert('Failed to delete user', 'error')
    });
  }

  toggleFcmToken(tok: SmsUserFcmToken) {
    const nextVal = !tok.is_active;
    this.api.toggleSmsFcmToken(tok.id, nextVal).subscribe({
      next: () => {
        tok.is_active = nextVal;
        this.showAlert(`Token status set to ${nextVal ? 'active' : 'inactive'}`, 'success');
        this.loadOverview();
      },
      error: () => this.showAlert('Failed to toggle token state', 'error')
    });
  }

  deleteFcmToken(tok: SmsUserFcmToken) {
    if (!confirm('Remove this FCM push token?')) return;
    this.api.deleteSmsFcmToken(tok.id).subscribe({
      next: () => {
        this.showAlert('Token removed', 'success');
        this.loadFcmTokens();
        this.loadOverview();
      },
      error: () => this.showAlert('Failed to remove token', 'error')
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================

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
