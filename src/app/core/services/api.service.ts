import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DashboardSummary, 
  Loan, 
  Person, 
  User, 
  MonthlyActivity, 
  SecurityLog 
} from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:5000/api';

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
}
