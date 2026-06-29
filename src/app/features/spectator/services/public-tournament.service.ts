import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  OrganizerTournamentResponse,
  PouleResponse,
  PouleStandingEntry,
  EliminationBracketResponse,
  TournamentPhase
} from '../../../core/models/tournament.models';
import { BoutResponse } from '../../../core/models/bout.models';

export interface LiveBoutSummary {
  boutId: number;
  tournamentId: number;
  tournamentName: string;
  piste: string | null;
  status: string;
  athleteLeftName: string;
  athleteRightName: string;
  scoreLeft: number;
  scoreRight: number;
  elapsedSeconds: number;
  pouleId: number | null;
  pouleNumber: number | null;
  eliminationRound: string | null;
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

/**
 * Service for public endpoints that require NO JWT.
 * The auth interceptor simply won't attach a token when none is stored,
 * and the backend permits these endpoints without authentication.
 *
 * NOTE: Components must NOT use HttpClient directly — all requests go through this service.
 */
@Injectable({ providedIn: 'root' })
export class PublicTournamentService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** All currently in-progress bouts — public endpoint for spectators */
  getLiveBouts(): Observable<LiveBoutSummary[]> {
    return this.http
      .get<ApiResponse<LiveBoutSummary[]>>(`${this.base}/bouts/live`)
      .pipe(map(r => r.data ?? []));
  }

  /** Get full details of a specific bout publicly */
  getBoutDetails(boutId: number): Observable<BoutResponse> {
    return this.http
      .get<ApiResponse<BoutResponse>>(`${this.base}/bouts/${boutId}`)
      .pipe(map(r => r.data));
  }

  /** All public tournaments, optionally filtered by phase */
  getPublicTournaments(params?: Record<string, string>): Observable<OrganizerTournamentResponse[]> {
    return this.http
      .get<ApiResponse<OrganizerTournamentResponse[]>>(`${this.base}/tournaments/public`, { params })
      .pipe(map(r => r.data ?? []));
  }

  /**
   * Tournaments that are currently in progress (POULES_IN_PROGRESS or ELIMINATION_IN_PROGRESS).
   * Used by the Live tournaments list page.
   */
  getTournamentsInProgress(): Observable<OrganizerTournamentResponse[]> {
    return this.getPublicTournaments({ status: 'POULES_IN_PROGRESS' }).pipe(
      map(poules => poules.concat()),
      // Also fetch elimination-in-progress and merge; both share the same type
      // Simpler: fetch without filter, then filter client-side since the list is small
    );
  }

  /**
   * All tournaments currently active (both poule and elimination phases).
   * Filters client-side after fetching the full public list.
   */
  getActiveTournaments(): Observable<OrganizerTournamentResponse[]> {
    return this.getPublicTournaments().pipe(
      map(list => list.filter(t =>
        t.phase === 'POULES_IN_PROGRESS' || t.phase === 'ELIMINATION_IN_PROGRESS'
      ))
    );
  }

  /** Poules for a tournament (public — needed for live view) */
  getPoules(tournamentId: number): Observable<PouleResponse[]> {
    return this.http
      .get<ApiResponse<PouleResponse[]>>(`${this.base}/tournaments/${tournamentId}/poules`)
      .pipe(map(r => r.data ?? []));
  }

  /** Poule standings for a tournament (public) */
  getStandings(tournamentId: number): Observable<PouleStandingEntry[]> {
    return this.http
      .get<ApiResponse<PouleStandingEntry[]>>(`${this.base}/tournaments/${tournamentId}/standings`)
      .pipe(map(r => r.data ?? []));
  }

  /** Elimination bracket for a tournament (public) */
  getBracket(tournamentId: number): Observable<EliminationBracketResponse | null> {
    return this.http
      .get<ApiResponse<EliminationBracketResponse>>(`${this.base}/tournaments/${tournamentId}/bracket`)
      .pipe(map(r => r.data ?? null));
  }

  /** Tournament results — podium + standings (public) */
  getTournamentResults(tournamentId: number): Observable<unknown> {
    return this.http
      .get<ApiResponse<unknown>>(`${this.base}/tournaments/${tournamentId}/results`)
      .pipe(map(r => r.data));
  }
}
