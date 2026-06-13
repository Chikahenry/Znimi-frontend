import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'loan_token';
  private readonly USER_KEY = 'loan_user';
  currentUser = signal<LoginResponse | null>(this.getStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/login`, request).pipe(
      tap(res => {
        const userData = res.data || res;
        localStorage.setItem(this.TOKEN_KEY, userData.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
        this.currentUser.set(userData);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role?.toLowerCase() === role.toLowerCase();
  }

  getCurrentUser(): LoginResponse | null {
  return this.currentUser();
}

  private getStoredUser(): LoginResponse | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }
}
