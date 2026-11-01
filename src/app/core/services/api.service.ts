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
  AdminCateringStaffByPerson
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
}
