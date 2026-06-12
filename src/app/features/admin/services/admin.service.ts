import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AdminDocumentValidationRequest,
  AdminPendingDocumentResponse,
  AdminStatsResponse,
  AdminUserResponse,
  UpdateUserRoleRequest
} from '../../../core/models/admin.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  getUsers(): Observable<AdminUserResponse[]> {
    return this.http.get<ApiResponse<AdminUserResponse[]>>(`${this.base}/users`)
      .pipe(map(r => r.data));
  }

  updateUserRole(userId: number, request: UpdateUserRoleRequest): Observable<AdminUserResponse> {
    return this.http.put<ApiResponse<AdminUserResponse>>(`${this.base}/users/${userId}/role`, request)
      .pipe(map(r => r.data));
  }

  getPendingDocuments(): Observable<AdminPendingDocumentResponse[]> {
    return this.http.get<ApiResponse<AdminPendingDocumentResponse[]>>(`${this.base}/documents/pending`)
      .pipe(map(r => r.data));
  }

  validateDocument(documentId: number, request: AdminDocumentValidationRequest): Observable<AdminPendingDocumentResponse> {
    return this.http.put<ApiResponse<AdminPendingDocumentResponse>>(
      `${this.base}/documents/${documentId}/validate`, request
    ).pipe(map(r => r.data));
  }

  getStats(): Observable<AdminStatsResponse> {
    return this.http.get<ApiResponse<AdminStatsResponse>>(`${this.base}/stats`)
      .pipe(map(r => r.data));
  }
}
