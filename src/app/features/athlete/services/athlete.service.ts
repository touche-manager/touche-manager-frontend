import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { AthleteRequest, AthleteResponse } from '../../../core/models/athlete.models';

@Injectable({
  providedIn: 'root'
})
export class AthleteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/athletes/profile`;

  getProfile(): Observable<AthleteResponse> {
    return this.http.get<ApiResponse<any>>(this.apiUrl).pipe(
      map(res => this.mapFromBackend(res.data))
    );
  }

  createProfile(request: AthleteRequest): Observable<AthleteResponse> {
    const payload = this.mapToBackend(request);
    return this.http.post<ApiResponse<any>>(this.apiUrl, payload).pipe(
      map(res => this.mapFromBackend(res.data))
    );
  }

  updateProfile(request: AthleteRequest): Observable<AthleteResponse> {
    const payload = this.mapToBackend(request);
    return this.http.put<ApiResponse<any>>(this.apiUrl, payload).pipe(
      map(res => this.mapFromBackend(res.data))
    );
  }

  private mapToBackend(req: AthleteRequest): any {
    return {
      ...req,
      gender: req.gender === 'MASCULINO' ? 'MALE' : 'FEMALE',
      dominantHand: req.dominantHand === 'DIESTRO' ? 'RIGHT' : 'LEFT'
    };
  }

  private mapFromBackend(data: any): AthleteResponse {
    return {
      ...data,
      gender: data.gender === 'MALE' ? 'MASCULINO' : 'FEMENINO',
      dominantHand: data.dominantHand === 'RIGHT' ? 'DIESTRO' : 'ZURDO'
    };
  }
}
