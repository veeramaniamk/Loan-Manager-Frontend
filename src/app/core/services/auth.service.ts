import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { User } from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000/api/auth';
  
  // Reactive state using Angular Signals
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('lm_jwt_token'));
  csrfToken = signal<string | null>(localStorage.getItem('lm_csrf_token'));

  isAuthenticated = computed(() => !!this.currentUser() && !!this.token());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {
    // If we have token but no CSRF token, fetch one
    if (!this.csrfToken()) {
      this.fetchCsrfToken().subscribe();
    }
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('lm_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  fetchCsrfToken(): Observable<any> {
    return this.http.get<{ success: boolean; csrfToken: string }>(`${this.apiUrl}/csrf`, { withCredentials: true }).pipe(
      tap(res => {
        if (res && res.csrfToken) {
          this.setCsrfToken(res.csrfToken);
        }
      }),
      catchError(err => of(null))
    );
  }

  setCsrfToken(token: string) {
    this.csrfToken.set(token);
    localStorage.setItem('lm_csrf_token', token);
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap(res => {
        if (res.success) {
          this.currentUser.set(res.user);
          this.token.set(res.token);
          this.csrfToken.set(res.csrfToken);

          localStorage.setItem('lm_user', JSON.stringify(res.user));
          localStorage.setItem('lm_jwt_token', res.token);
          localStorage.setItem('lm_csrf_token', res.csrfToken);
        }
      })
    );
  }

  register(userData: { username: string; email: string; password: string; full_name: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData, { withCredentials: true });
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  clearSession() {
    this.currentUser.set(null);
    this.token.set(null);
    this.csrfToken.set(null);
    localStorage.removeItem('lm_user');
    localStorage.removeItem('lm_jwt_token');
    localStorage.removeItem('lm_csrf_token');
    localStorage.removeItem('lm_dash_summary');
    localStorage.removeItem('lm_admin_users');
    localStorage.removeItem('lm_loans_cache');
    localStorage.removeItem('lm_people_cache');
    this.router.navigate(['/login']);
  }

  verifySession(): Observable<any> {
    return this.http.get<{ success: boolean; user: User }>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem('lm_user', JSON.stringify(res.user));
        }
      }),
      catchError(err => {
        this.clearSession();
        return of(null);
      })
    );
  }
}
