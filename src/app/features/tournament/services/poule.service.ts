import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  PouleResponse,
  EliminationBracketResponse,
  PouleStandingEntry,
} from '../../../core/models/tournament.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class PouleService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Organizer ──
  generatePoules(tournamentId: number): Observable<PouleResponse[]> {
    return this.http.post<ApiResponse<PouleResponse[]>>(
      `${this.base}/organizer/tournaments/${tournamentId}/generate-poules`, {}
    ).pipe(map(r => r.data));
  }

  generateBracket(tournamentId: number): Observable<EliminationBracketResponse> {
    return this.http.post<ApiResponse<EliminationBracketResponse>>(
      `${this.base}/organizer/tournaments/${tournamentId}/generate-bracket`, {}
    ).pipe(map(r => r.data));
  }

  assignRefereeToPoule(pouleId: number, refereeUserId: number): Observable<PouleResponse> {
    return this.http.post<ApiResponse<PouleResponse>>(
      `${this.base}/poules/${pouleId}/referees`, { refereeUserId }
    ).pipe(map(r => r.data));
  }

  removeRefereeFromPoule(pouleId: number, refereeUserId: number): Observable<PouleResponse> {
    return this.http.delete<ApiResponse<PouleResponse>>(
      `${this.base}/poules/${pouleId}/referees/${refereeUserId}`
    ).pipe(map(r => r.data));
  }

  // ── Common ──
  getPoulesForTournament(tournamentId: number): Observable<PouleResponse[]> {
    return this.http.get<ApiResponse<PouleResponse[]>>(
      `${this.base}/tournaments/${tournamentId}/poules`
    ).pipe(map(r => r.data));
  }

  getPouleDetails(pouleId: number): Observable<PouleResponse> {
    return this.http.get<ApiResponse<PouleResponse>>(
      `${this.base}/poules/${pouleId}`
    ).pipe(map(r => r.data));
  }

  getStandings(tournamentId: number): Observable<PouleStandingEntry[]> {
    return this.http.get<ApiResponse<PouleStandingEntry[]>>(
      `${this.base}/tournaments/${tournamentId}/standings`
    ).pipe(map(r => r.data));
  }

  getBracket(tournamentId: number): Observable<EliminationBracketResponse> {
    return this.http.get<ApiResponse<EliminationBracketResponse>>(
      `${this.base}/tournaments/${tournamentId}/bracket`
    ).pipe(map(r => r.data));
  }

  // ── Referee ──
  getRefereePoules(tournamentId: number): Observable<PouleResponse[]> {
    return this.http.get<ApiResponse<PouleResponse[]>>(
      `${this.base}/poules/my/${tournamentId}`
    ).pipe(map(r => r.data));
  }
}
