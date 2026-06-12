import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  PublicTournamentFilters,
  PublicTournamentResponse
} from '../../../core/models/tournament.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Public tournament search — no auth required */
@Injectable({ providedIn: 'root' })
export class PublicTournamentService {
  private readonly http = inject(HttpClient);

  search(filters: PublicTournamentFilters): Observable<PublicTournamentResponse[]> {
    let params = new HttpParams();
    if (filters.status)   params = params.set('status', filters.status);
    if (filters.weapon)   params = params.set('weapon', filters.weapon);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.gender)   params = params.set('gender', filters.gender);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)   params = params.set('dateTo', filters.dateTo);

    return this.http.get<ApiResponse<PublicTournamentResponse[]>>(
      `${environment.apiUrl}/tournaments/public`, { params }
    ).pipe(map(r => r.data));
  }
}
