import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { RefereeApplicationResponse, RefereeApplicationStatus } from '../../../core/models/tournament.models';

interface ApiResponse<T> { success: boolean; data: T; }

@Injectable({ providedIn: 'root' })
export class RefereeApplicationService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  apply(tournamentId: number): Observable<RefereeApplicationResponse> {
    return this.http.post<ApiResponse<RefereeApplicationResponse>>(
      `${this.base}/referee-applications/${tournamentId}`, {}
    ).pipe(map(r => r.data));
  }

  getMyApplications(): Observable<RefereeApplicationResponse[]> {
    return this.http.get<ApiResponse<RefereeApplicationResponse[]>>(
      `${this.base}/referee-applications/my`
    ).pipe(map(r => r.data));
  }

  getApplicationsForTournament(tournamentId: number): Observable<RefereeApplicationResponse[]> {
    return this.http.get<ApiResponse<RefereeApplicationResponse[]>>(
      `${this.base}/referee-applications/tournament/${tournamentId}`
    ).pipe(map(r => r.data));
  }

  review(applicationId: number, status: RefereeApplicationStatus): Observable<RefereeApplicationResponse> {
    return this.http.patch<ApiResponse<RefereeApplicationResponse>>(
      `${this.base}/referee-applications/${applicationId}/review`, { status }
    ).pipe(map(r => r.data));
  }

  cancel(applicationId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/referee-applications/${applicationId}`);
  }
}
