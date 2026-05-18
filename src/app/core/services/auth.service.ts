import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, RegisterRequest, RegisterResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenSignal = signal<string | null>(localStorage.getItem('touche_token'));

  readonly token = this.tokenSignal.asReadonly();

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<ApiResponse<RegisterResponse>>(`${environment.apiUrl}/auth/register`, request)
      .pipe(map(res => res.data));
  }

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('touche_token', token);
    } else {
      localStorage.removeItem('touche_token');
    }
    this.tokenSignal.set(token);
  }

  clearToken(): void {
    this.setToken(null);
  }
}
