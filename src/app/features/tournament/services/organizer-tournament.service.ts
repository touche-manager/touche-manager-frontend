import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  OrganizerTournamentResponse,
  TournamentRequest,
  EnrollmentDetailResponse,
  DocumentValidationRequest
} from '../../../core/models/tournament.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class OrganizerTournamentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/organizer/tournaments`;

  getMyTournaments(): Observable<OrganizerTournamentResponse[]> {
    return this.http.get<ApiResponse<OrganizerTournamentResponse[]>>(this.base)
      .pipe(map(r => r.data));
  }

  getTournamentById(id: number): Observable<OrganizerTournamentResponse> {
    return this.http.get<ApiResponse<OrganizerTournamentResponse>>(`${this.base}/${id}`)
      .pipe(map(r => r.data));
  }

  createTournament(request: TournamentRequest): Observable<OrganizerTournamentResponse> {
    return this.http.post<ApiResponse<OrganizerTournamentResponse>>(this.base, request)
      .pipe(map(r => r.data));
  }

  updateTournament(id: number, request: TournamentRequest): Observable<OrganizerTournamentResponse> {
    return this.http.put<ApiResponse<OrganizerTournamentResponse>>(`${this.base}/${id}`, request)
      .pipe(map(r => r.data));
  }

  deleteTournament(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getEnrollments(tournamentId: number): Observable<EnrollmentDetailResponse[]> {
    return this.http.get<ApiResponse<EnrollmentDetailResponse[]>>(`${this.base}/${tournamentId}/enrollments`)
      .pipe(map(r => r.data));
  }

  validateDocument(documentId: number, request: DocumentValidationRequest): Observable<void> {
    return this.http.patch<ApiResponse<void>>(
      `${this.base}/documents/${documentId}/validate`,
      request
    ).pipe(map(() => void 0));
  }
}
