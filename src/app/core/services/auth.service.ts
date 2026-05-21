import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  NombreRol,
  RegisterRequest,
  RegisterResponse,
  SelectRoleRequest
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly tokenSignal = signal<string | null>(localStorage.getItem('touche_token'));
  private readonly rolSignal = signal<NombreRol | null>(
    localStorage.getItem('touche_rol') as NombreRol | null
  );
  private readonly pendingRolesSignal = signal<NombreRol[] | null>(null);
  private readonly rolesSignal = signal<NombreRol[]>(
    JSON.parse(localStorage.getItem('touche_roles') || '[]')
  );

  readonly token = this.tokenSignal.asReadonly();
  readonly currentRol = this.rolSignal.asReadonly();
  readonly pendingRoles = this.pendingRolesSignal.asReadonly();
  readonly roles = this.rolesSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly hasMultipleRoles = computed(() => this.rolesSignal().length > 1);

  // ── Registration ────────────────────────────────────────────────────────────

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<ApiResponse<RegisterResponse>>(`${environment.apiUrl}/auth/register`, request)
      .pipe(map(res => res.data));
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, request)
      .pipe(
        map(res => {
          const data = res.data;
          if (data.roles && data.roles.length > 0) {
            // Multiple roles — store pending list and temp token
            this.pendingRolesSignal.set(data.roles);
            localStorage.setItem('touche_roles', JSON.stringify(data.roles));
            this.rolesSignal.set(data.roles);
            if (data.token) {
              localStorage.setItem('touche_token', data.token);
              this.tokenSignal.set(data.token);
            }
          } else if (data.token) {
            // Single role — store token immediately
            this.setToken(data.token);
            const payload = this.decodePayload(data.token);
            const rol = payload?.['rol'] as NombreRol | null;
            if (rol) {
              localStorage.setItem('touche_roles', JSON.stringify([rol]));
              this.rolesSignal.set([rol]);
            }
          }
          return data;
        })
      );
  }

  // ── Select role ──────────────────────────────────────────────────────────────

  selectRole(request: SelectRoleRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/select-role`, request)
      .pipe(
        map(res => {
          const data = res.data;
          if (data.token) {
            this.setToken(data.token);
          }
          this.pendingRolesSignal.set(null);
          return data;
        })
      );
  }

  // ── Token management ─────────────────────────────────────────────────────────

  setToken(token: string | null): void {
    if (token) {
      const payload = this.decodePayload(token);
      const rol = payload?.['rol'] as NombreRol | null;

      localStorage.setItem('touche_token', token);
      this.tokenSignal.set(token);

      if (rol) {
        localStorage.setItem('touche_rol', rol);
        this.rolSignal.set(rol);
      }
    } else {
      this.clearSession();
    }
  }

  logout(): void {
    this.clearSession();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private clearSession(): void {
    localStorage.removeItem('touche_token');
    localStorage.removeItem('touche_rol');
    localStorage.removeItem('touche_roles');
    this.tokenSignal.set(null);
    this.rolSignal.set(null);
    this.pendingRolesSignal.set(null);
    this.rolesSignal.set([]);
  }

  private decodePayload(token: string): Record<string, unknown> | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}
