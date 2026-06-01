import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import {
  TournamentResponse,
  EnrollmentResponse
} from '../../../core/models/tournament.models';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tournaments`;

  getAvailableTournaments(): Observable<TournamentResponse[]> {
    return this.http.get<ApiResponse<TournamentResponse[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getTournamentDetails(id: number): Observable<TournamentResponse> {
    return this.http.get<ApiResponse<TournamentResponse>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  enroll(tournamentId: number): Observable<EnrollmentResponse> {
    return this.http.post<ApiResponse<EnrollmentResponse>>(`${this.apiUrl}/enroll`, { tournamentId }).pipe(
      map(res => res.data)
    );
  }

  confirmPayment(enrollmentId: number, paymentId: string): Observable<EnrollmentResponse> {
    return this.http.post<ApiResponse<EnrollmentResponse>>(`${this.apiUrl}/enrollments/${enrollmentId}/confirm`, { paymentId }).pipe(
      map(res => res.data)
    );
  }

  cancelEnrollment(enrollmentId: number): Observable<EnrollmentResponse> {
    return this.http.post<ApiResponse<EnrollmentResponse>>(`${this.apiUrl}/enrollments/${enrollmentId}/cancel`, {}).pipe(
      map(res => res.data)
    );
  }
}
