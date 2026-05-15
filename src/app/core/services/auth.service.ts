import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(localStorage.getItem('auth_token'));

  readonly token = this.tokenSignal.asReadonly();

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }

    this.tokenSignal.set(token);
  }

  clearToken(): void {
    this.setToken(null);
  }
}
