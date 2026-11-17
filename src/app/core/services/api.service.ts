import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DashboardSummary, 
  Loan, 
  Person, 
  User, 
  MonthlyActivity, 
  SecurityLog,
  CateringService,
  CateringMember,
  CateringServiceStaff,
  CateringStaffPayment,
  CateringSummary,
  AdminCateringStaffByPerson,
  DailyExpense,
  ExpenseTag,
  ExpensePaymentMethod,
  ExpenseOverviewSummary,
  SmsDevice,
  SmsMessage,
  SmsNotification,
  SmsUserDeviceAccess,
  SmsUserFcmToken,
  SmsUser,
  SmsUserSummary,
  SmsLog,
  SmsGatewayOverview
} from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // 1. Dashboard
  getDashboardSummary(): Observable<{ success: boolean; data: DashboardSummary }> {
    return this.http.get<{ success: boolean; data: DashboardSummary }>(`${this.baseUrl}/dashboard/summary`);
  }

  // 2. Loans
  getLoans(filters?: {
    type?: string;
    status?: string;
    person_id?: number;
    location?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
  }): Observable<{ success: boolean; data: Loan[] }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<{ success: boolean; data: Loan[] }>(`${this.baseUrl}/loans`, { params });
  }

  getLoanById(id: number): Observable<{ success: boolean; data: Loan }> {
    return this.http.get<{ success: boolean; data: Loan }>(`${this.baseUrl}/loans/${id}`);
  }

  createLoan(loanData: any): Observable<{ success: boolean; message: string; loanId: number }> {
    return this.http.post<{ success: boolean; message: string; loanId: number }>(`${this.baseUrl}/loans`, loanData);
  }

  updateLoan(id: number, loanData: any): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/loans/${id}`, loanData);
  }

  deleteLoan(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/loans/${id}`);
  }

  addLoanPayment(loanId: number, payment: {
    amount: number;
    payment_date: string;
    payment_method?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string; paymentId: number }> {
    return this.http.post<{ success: boolean; message: string; paymentId: number }>(
      `${this.baseUrl}/loans/${loanId}/payments`,
      payment
    );
  }

  deleteLoanPayment(loanId: number, paymentId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/loans/${loanId}/payments/${paymentId}`
    );
  }

  // 3. People (Borrowers / Lenders)
  getPeople(): Observable<{ success: boolean; data: Person[] }> {
    return this.http.get<{ success: boolean; data: Person[] }>(`${this.baseUrl}/people`);
  }

  getPersonById(id: number): Observable<{ success: boolean; data: Person & { loans: Loan[] } }> {
    return this.http.get<{ success: boolean; data: Person & { loans: Loan[] } }>(`${this.baseUrl}/people/${id}`);
  }

  createPerson(person: {
    name: string;
    phone?: string;
    email?: string;
    location?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string; personId: number }> {
    return this.http.post<{ success: boolean; message: string; personId: number }>(`${this.baseUrl}/people`, person);
  }

  updatePerson(id: number, person: Partial<Person>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/people/${id}`, person);
  }

  deletePerson(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/people/${id}`);
  }

  // 4. Admin Management
  getAdminUsers(): Observable<{ success: boolean; data: User[] }> {
    return this.http.get<{ success: boolean; data: User[] }>(`${this.baseUrl}/admin/users`);
  }

  createAdminUser(userData: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role?: 'admin' | 'user';
    status?: 'active' | 'inactive';
  }): Observable<{ success: boolean; message: string; userId: number }> {
    return this.http.post<{ success: boolean; message: string; userId: number }>(`${this.baseUrl}/admin/users`, userData);
  }

  updateAdminUser(id: number, userData: any): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/admin/users/${id}`, userData);
  }

  deleteAdminUser(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/users/${id}`);
  }

  getAdminMonthlyActivity(): Observable<{ success: boolean; data: MonthlyActivity[] }> {
    return this.http.get<{ success: boolean; data: MonthlyActivity[] }>(`${this.baseUrl}/admin/activity/monthly`);
  }

  getAdminSecurityLogs(limit: number = 50, statusCode?: number): Observable<{ success: boolean; data: SecurityLog[] }> {
    let params = new HttpParams().set('limit', limit.toString());
    if (statusCode) {
      params = params.set('status_code', statusCode.toString());
    }
    return this.http.get<{ success: boolean; data: SecurityLog[] }>(`${this.baseUrl}/admin/logs`, { params });
  }

  // ----------------- CATERING SERVICES & STAFF SALARIES -----------------

  getCateringSummary(): Observable<{ success: boolean; data: CateringSummary }> {
    return this.http.get<{ success: boolean; data: CateringSummary }>(`${this.baseUrl}/catering/summary`);
  }

  getCateringServices(filters?: {
    status?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
  }): Observable<{ success: boolean; data: CateringService[] }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<{ success: boolean; data: CateringService[] }>(`${this.baseUrl}/catering/services`, { params });
  }

  getCateringServiceById(id: number): Observable<{ success: boolean; data: CateringService }> {
    return this.http.get<{ success: boolean; data: CateringService }>(`${this.baseUrl}/catering/services/${id}`);
  }

  createCateringService(serviceData: any): Observable<{ success: boolean; message: string; serviceId: number }> {
    return this.http.post<{ success: boolean; message: string; serviceId: number }>(`${this.baseUrl}/catering/services`, serviceData);
  }

  updateCateringService(id: number, serviceData: any): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/catering/services/${id}`, serviceData);
  }

  deleteCateringService(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/catering/services/${id}`);
  }

  addCateringStaff(
    serviceId: number, 
    staffData: {
      member_id?: number;
      new_member?: { name: string; phone: string; role?: string; notes?: string };
      worked_morning?: boolean;
      worked_afternoon?: boolean;
      worked_night?: boolean;
      rate_per_session?: number;
      remarks?: string;
    }
  ): Observable<{ success: boolean; message: string; staffId: number; sessionCount: number; totalSalary: number }> {
    return this.http.post<{ success: boolean; message: string; staffId: number; sessionCount: number; totalSalary: number }>(
      `${this.baseUrl}/catering/services/${serviceId}/staff`, 
      staffData
    );
  }

  updateCateringStaff(
    serviceId: number, 
    staffId: number, 
    data: {
      worked_morning?: boolean;
      worked_afternoon?: boolean;
      worked_night?: boolean;
      rate_per_session?: number;
      remarks?: string;
    }
  ): Observable<{ success: boolean; message: string; sessionCount: number; totalSalary: number; paidStatus: string }> {
    return this.http.put<{ success: boolean; message: string; sessionCount: number; totalSalary: number; paidStatus: string }>(
      `${this.baseUrl}/catering/services/${serviceId}/staff/${staffId}`, 
      data
    );
  }

  removeCateringStaff(serviceId: number, staffId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/catering/services/${serviceId}/staff/${staffId}`
    );
  }

  payCateringStaff(
    serviceId: number, 
    staffId: number, 
    paymentData: {
      amount?: number;
      payment_date?: string;
      payment_method?: string;
      notes?: string;
    }
  ): Observable<{ 
    success: boolean; 
    message: string; 
    paymentId: number; 
    paidAmount: number; 
    paidStatus: string; 
    remainingPending: number;
  }> {
    return this.http.post<{ 
      success: boolean; 
      message: string; 
      paymentId: number; 
      paidAmount: number; 
      paidStatus: string; 
      remainingPending: number;
    }>(`${this.baseUrl}/catering/services/${serviceId}/staff/${staffId}/pay`, paymentData);
  }

  getCateringMembers(): Observable<{ success: boolean; data: CateringMember[] }> {
    return this.http.get<{ success: boolean; data: CateringMember[] }>(`${this.baseUrl}/catering/members`);
  }

  createCateringMember(data: any): Observable<{ success: boolean; message: string; memberId: number }> {
    return this.http.post<{ success: boolean; message: string; memberId: number }>(`${this.baseUrl}/catering/members`, data);
  }

  updateCateringMember(id: number, data: any): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/catering/members/${id}`, data);
  }

  deleteCateringMember(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/catering/members/${id}`);
  }

  getCateringPaymentLogs(filters?: { member_id?: number; service_id?: number; limit?: number }): Observable<{ success: boolean; data: CateringStaffPayment[] }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.member_id) params = params.set('member_id', filters.member_id.toString());
      if (filters.service_id) params = params.set('service_id', filters.service_id.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<{ success: boolean; data: CateringStaffPayment[] }>(`${this.baseUrl}/catering/payments/logs`, { params });
  }

  // Admin Catering Endpoints
  getAdminCateringSummary(): Observable<{ success: boolean; data: CateringSummary }> {
    return this.http.get<{ success: boolean; data: CateringSummary }>(`${this.baseUrl}/admin/catering/summary`);
  }

  getAdminCateringStaffByPerson(): Observable<{ success: boolean; data: AdminCateringStaffByPerson[] }> {
    return this.http.get<{ success: boolean; data: AdminCateringStaffByPerson[] }>(`${this.baseUrl}/admin/catering/staff-by-person`);
  }

  getAdminCateringStaffLogs(filters?: { member_id?: number; user_id?: number; limit?: number }): Observable<{ success: boolean; data: CateringStaffPayment[] }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.member_id) params = params.set('member_id', filters.member_id.toString());
      if (filters.user_id) params = params.set('user_id', filters.user_id.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<{ success: boolean; data: CateringStaffPayment[] }>(`${this.baseUrl}/admin/catering/staff-logs`, { params });
  }

  // ==========================================
  // 💸 DAILY EXPENSES & TAGS ENDPOINTS
  // ==========================================

  getExpenses(filters?: {
    search?: string;
    tag_id?: number | string;
    payment_type?: string;
    payment_method_id?: number | string;
    from_date?: string;
    to_date?: string;
    month?: number | string;
    year?: number | string;
  }): Observable<{ success: boolean; data: DailyExpense[] }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<{ success: boolean; data: DailyExpense[] }>(`${this.baseUrl}/expenses`, { params });
  }

  createExpense(data: {
    title: string;
    amount: number;
    expense_date?: string;
    tag_id?: number | null;
    payment_type?: 'cash' | 'upi' | 'other';
    payment_method_id?: number | null;
    payment_app_name?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string; expenseId: number }> {
    return this.http.post<{ success: boolean; message: string; expenseId: number }>(`${this.baseUrl}/expenses`, data);
  }

  updateExpense(id: number, data: {
    title: string;
    amount: number;
    expense_date: string;
    tag_id?: number | null;
    payment_type?: 'cash' | 'upi' | 'other';
    payment_method_id?: number | null;
    payment_app_name?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/expenses/${id}`, data);
  }

  deleteExpense(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/expenses/${id}`);
  }

  getExpenseOverview(mode: 'monthly' | 'yearly' = 'monthly', year?: number, month?: number): Observable<{ success: boolean; data: ExpenseOverviewSummary }> {
    let params = new HttpParams().set('mode', mode);
    if (year) params = params.set('year', year.toString());
    if (month && mode === 'monthly') params = params.set('month', month.toString());
    return this.http.get<{ success: boolean; data: ExpenseOverviewSummary }>(`${this.baseUrl}/expenses/overview`, { params });
  }

  getExpenseTags(): Observable<{ success: boolean; data: ExpenseTag[] }> {
    return this.http.get<{ success: boolean; data: ExpenseTag[] }>(`${this.baseUrl}/expenses/tags`);
  }

  createExpenseTag(tag: { name: string; color?: string; icon?: string }): Observable<{ success: boolean; message: string; data: ExpenseTag }> {
    return this.http.post<{ success: boolean; message: string; data: ExpenseTag }>(`${this.baseUrl}/expenses/tags`, tag);
  }

  updateExpenseTag(id: number, tag: { name: string; color?: string; icon?: string }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/expenses/tags/${id}`, tag);
  }

  deleteExpenseTag(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/expenses/tags/${id}`);
  }

  getExpensePaymentMethods(): Observable<{ success: boolean; data: ExpensePaymentMethod[] }> {
    return this.http.get<{ success: boolean; data: ExpensePaymentMethod[] }>(`${this.baseUrl}/expenses/payment-methods`);
  }

  createExpensePaymentMethod(method: { type: string; name: string; icon?: string; is_default?: boolean }): Observable<{ success: boolean; message: string; data: ExpensePaymentMethod }> {
    return this.http.post<{ success: boolean; message: string; data: ExpensePaymentMethod }>(`${this.baseUrl}/expenses/payment-methods`, method);
  }

  updateExpensePaymentMethod(id: number, method: { type?: string; name?: string; icon?: string; status?: string; is_default?: boolean }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/expenses/payment-methods/${id}`, method);
  }

  deleteExpensePaymentMethod(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/expenses/payment-methods/${id}`);
  }

  // ==========================================
  // 📱 SMS GATEWAY & DAD'S PHONE TELEMETRY (ADMIN ONLY)
  // ==========================================

  getSmsOverview(): Observable<{ success: boolean; data: SmsGatewayOverview }> {
    return this.http.get<{ success: boolean; data: SmsGatewayOverview }>(`${this.baseUrl}/admin/sms/overview`);
  }

  getSmsMessages(filters?: {
    search?: string;
    device_id?: number | string;
    type?: string;
    is_read?: number | string;
    limit?: number;
    offset?: number;
  }): Observable<{ success: boolean; data: SmsMessage[] }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<{ success: boolean; data: SmsMessage[] }>(`${this.baseUrl}/admin/sms/messages`, { params });
  }

  sendSimulatedSms(data: {
    device_id: number;
    sender: string;
    message: string;
    type?: string;
  }): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(`${this.baseUrl}/admin/sms/messages`, data);
  }

  toggleSmsMessageRead(id: number, is_read: boolean): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/messages/${id}/read`, { is_read });
  }

  markAllSmsRead(deviceId?: number): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/messages-batch/mark-all-read`, { device_id: deviceId });
  }

  deleteSmsMessage(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/messages/${id}`);
  }

  getSmsDevices(): Observable<{ success: boolean; data: SmsDevice[] }> {
    return this.http.get<{ success: boolean; data: SmsDevice[] }>(`${this.baseUrl}/admin/sms/devices`);
  }

  createSmsDevice(device: { device_name: string; phone_number?: string; owner_id?: number; owner_name?: string }): Observable<{ success: boolean; message: string; deviceId: number }> {
    return this.http.post<{ success: boolean; message: string; deviceId: number }>(`${this.baseUrl}/admin/sms/devices`, device);
  }

  updateSmsDevice(id: number, device: { device_name: string; phone_number?: string; owner_id?: number; owner_name?: string }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/devices/${id}`, device);
  }

  deleteSmsDevice(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/devices/${id}`);
  }

  getSmsNotifications(filters?: { status?: string; limit?: number }): Observable<{ success: boolean; data: SmsNotification[] }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<{ success: boolean; data: SmsNotification[] }>(`${this.baseUrl}/admin/sms/notifications`, { params });
  }

  retrySmsNotification(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/notifications/${id}/retry`, {});
  }

  getSmsDeviceAccess(): Observable<{ success: boolean; data: SmsUserDeviceAccess[] }> {
    return this.http.get<{ success: boolean; data: SmsUserDeviceAccess[] }>(`${this.baseUrl}/admin/sms/access`);
  }

  grantSmsDeviceAccess(access: {
    user_id: number;
    device_id: number;
    can_view_messages?: boolean;
    can_delete_messages?: boolean;
    can_receive_notifications?: boolean;
    can_send_sms?: boolean;
  }): Observable<{ success: boolean; message: string; id: number }> {
    return this.http.post<{ success: boolean; message: string; id: number }>(`${this.baseUrl}/admin/sms/access`, access);
  }

  updateSmsDeviceAccess(id: number, access: {
    can_view_messages: boolean;
    can_delete_messages: boolean;
    can_receive_notifications: boolean;
    can_send_sms: boolean;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/access/${id}`, access);
  }

  revokeSmsDeviceAccess(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/access/${id}`);
  }

  getSmsUsers(): Observable<{ success: boolean; data: SmsUser[] }> {
    return this.http.get<{ success: boolean; data: SmsUser[] }>(`${this.baseUrl}/admin/sms/users`);
  }

  createSmsUser(user: { name?: string; email: string; user_type?: string; is_admin?: boolean }): Observable<{ success: boolean; message: string; userId: number }> {
    return this.http.post<{ success: boolean; message: string; userId: number }>(`${this.baseUrl}/admin/sms/users`, user);
  }

  updateSmsUser(id: number, user: { name?: string; email: string; user_type?: string; is_admin?: boolean }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/users/${id}`, user);
  }

  deleteSmsUser(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/users/${id}`);
  }

  getSmsFcmTokens(): Observable<{ success: boolean; data: SmsUserFcmToken[] }> {
    return this.http.get<{ success: boolean; data: SmsUserFcmToken[] }>(`${this.baseUrl}/admin/sms/fcm-tokens`);
  }

  toggleSmsFcmToken(id: number, is_active: boolean): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/fcm-tokens/${id}/toggle`, { is_active });
  }

  deleteSmsFcmToken(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/fcm-tokens/${id}`);
  }

  getSmsLogs(filters?: { search?: string; limit?: number }): Observable<{ success: boolean; data: SmsLog[] }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<{ success: boolean; data: SmsLog[] }>(`${this.baseUrl}/admin/sms/logs`, { params });
  }

  deleteSmsLog(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/logs/${id}`);
  }

  clearSmsLogs(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/logs-clear`);
  }

  // ==========================================
  // 👤 USER-SCOPED SMS GATEWAY OPERATIONS
  // ==========================================

  getSmsUserByEmail(email: string): Observable<{
    success: boolean;
    user: SmsUser;
    devices: SmsDevice[];
    activeDevice: SmsDevice | null;
  }> {
    const params = new HttpParams().set('email', email.trim());
    return this.http.get<{
      success: boolean;
      user: SmsUser;
      devices: SmsDevice[];
      activeDevice: SmsDevice | null;
    }>(`${this.baseUrl}/admin/sms/users/by-email`, { params });
  }

  getSmsUserSummary(userId: number): Observable<{ success: boolean; data: SmsUserSummary }> {
    return this.http.get<{ success: boolean; data: SmsUserSummary }>(`${this.baseUrl}/admin/sms/users/${userId}/summary`);
  }

  getUserDevices(userId: number): Observable<{ success: boolean; data: SmsDevice[] }> {
    return this.http.get<{ success: boolean; data: SmsDevice[] }>(`${this.baseUrl}/admin/sms/users/${userId}/devices`);
  }

  createUserDevice(userId: number, device: { device_name: string; phone_number?: string; owner_name?: string }): Observable<{ success: boolean; message: string; deviceId: number }> {
    return this.http.post<{ success: boolean; message: string; deviceId: number }>(`${this.baseUrl}/admin/sms/users/${userId}/devices`, device);
  }

  getUserMessages(userId: number, filters?: {
    search?: string;
    device_id?: number | string;
    type?: string;
    is_read?: number | string;
    limit?: number;
    offset?: number;
  }): Observable<{ success: boolean; data: SmsMessage[]; pagination?: { limit: number; offset: number; total: number } }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<{ success: boolean; data: SmsMessage[]; pagination?: { limit: number; offset: number; total: number } }>(`${this.baseUrl}/admin/sms/users/${userId}/messages`, { params });
  }

  ingestUserMessage(userId: number, data: {
    device_id: number;
    sender: string;
    message: string;
    type?: string;
    received_at?: string;
  }): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(`${this.baseUrl}/admin/sms/users/${userId}/messages`, data);
  }

  toggleUserMessageRead(userId: number, id: number, is_read: boolean): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/users/${userId}/messages/${id}/read`, { is_read });
  }

  deleteUserMessage(userId: number, id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/users/${userId}/messages/${id}`);
  }

  triggerUserDeviceSync(userId: number, data?: { device_id?: number; limit?: number }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/admin/sms/users/${userId}/sync`, data || {});
  }

  getUserAccess(userId: number): Observable<{ success: boolean; data: SmsUserDeviceAccess[] }> {
    return this.http.get<{ success: boolean; data: SmsUserDeviceAccess[] }>(`${this.baseUrl}/admin/sms/users/${userId}/access`);
  }

  grantUserAccess(userId: number, access: {
    target_user_id?: number;
    device_id: number;
    can_view_messages?: boolean;
    can_delete_messages?: boolean;
    can_receive_notifications?: boolean;
    can_send_sms?: boolean;
  }): Observable<{ success: boolean; message: string; id: number }> {
    return this.http.post<{ success: boolean; message: string; id: number }>(`${this.baseUrl}/admin/sms/users/${userId}/access`, access);
  }

  getUserFcmTokens(userId: number): Observable<{ success: boolean; data: SmsUserFcmToken[] }> {
    return this.http.get<{ success: boolean; data: SmsUserFcmToken[] }>(`${this.baseUrl}/admin/sms/users/${userId}/fcm-tokens`);
  }

  saveUserFcmToken(userId: number, token: {
    fcm_token: string;
    device_info?: string;
  }): Observable<{ success: boolean; message: string; id: number }> {
    return this.http.post<{ success: boolean; message: string; id: number }>(`${this.baseUrl}/admin/sms/users/${userId}/fcm-tokens`, token);
  }

  getUserNotifications(userId: number): Observable<{ success: boolean; data: SmsNotification[] }> {
    return this.http.get<{ success: boolean; data: SmsNotification[] }>(`${this.baseUrl}/admin/sms/users/${userId}/notifications`);
  }
}
