import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token();
  const csrfToken = authService.csrfToken();

  let headersConfig: Record<string, string> = {
    'Accept': 'application/json'
  };

  if (token) {
    headersConfig['Authorization'] = `Bearer ${token}`;
  }

  if (csrfToken) {
    headersConfig['x-csrf-token'] = csrfToken;
    headersConfig['x-xsrf-token'] = csrfToken;
  }

  const sessionId = localStorage.getItem('lm_session_id');
  if (sessionId) {
    headersConfig['x-session-id'] = sessionId;
  }

  // Always enable withCredentials so session cookies are exchanged automatically
  const cloned = req.clone({
    setHeaders: headersConfig,
    withCredentials: true
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // If unauthorized and not already on the login or public endpoints
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/csrf')) {
        console.warn(`[HTTP Error ${error.status}] Access revoked or session expired:`, error.error);
        if (error.status === 401) {
          authService.clearSession();
        }
      }
      return throwError(() => error);
    })
  );
};
