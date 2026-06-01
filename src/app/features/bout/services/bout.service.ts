import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  BoutRequest,
  BoutResponse,
  BoutEventRequest,
  ElapsedTimeRequest,
  TournamentStandingsResponse
} from '../../../core/models/bout.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class BoutService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bouts`;

  getBoutsByTournament(tournamentId: number): Observable<BoutResponse[]> {
    return this.http.get<ApiResponse<BoutResponse[]>>(`${this.base}/tournament/${tournamentId}`)
      .pipe(map(r => r.data));
  }

  getBoutDetails(boutId: number): Observable<BoutResponse> {
    return this.http.get<ApiResponse<BoutResponse>>(`${this.base}/${boutId}`)
      .pipe(map(r => r.data));
  }

  getTournamentStandings(tournamentId: number): Observable<TournamentStandingsResponse> {
    return this.http.get<ApiResponse<TournamentStandingsResponse>>(
      `${this.base}/tournament/${tournamentId}/standings`
    ).pipe(map(r => r.data));
  }

  createBout(request: BoutRequest): Observable<BoutResponse> {
    return this.http.post<ApiResponse<BoutResponse>>(this.base, request)
      .pipe(map(r => r.data));
  }

  startBout(boutId: number): Observable<BoutResponse> {
    return this.http.post<ApiResponse<BoutResponse>>(`${this.base}/${boutId}/start`, {})
      .pipe(map(r => r.data));
  }

  recordEvent(boutId: number, request: BoutEventRequest): Observable<BoutResponse> {
    return this.http.post<ApiResponse<BoutResponse>>(`${this.base}/${boutId}/events`, request)
      .pipe(map(r => r.data));
  }

  updateElapsedTime(boutId: number, request: ElapsedTimeRequest): Observable<BoutResponse> {
    return this.http.patch<ApiResponse<BoutResponse>>(`${this.base}/${boutId}/time`, request)
      .pipe(map(r => r.data));
  }

  finishBout(boutId: number): Observable<BoutResponse> {
    return this.http.post<ApiResponse<BoutResponse>>(`${this.base}/${boutId}/finish`, {})
      .pipe(map(r => r.data));
  }
}
