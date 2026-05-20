import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AthleteService } from './athlete.service';
import { AthleteRequest } from '../../../core/models/athlete.models';
import { environment } from '../../../../environments/environment';

describe('AthleteService', () => {
  let service: AthleteService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/athletes/profile`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AthleteService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AthleteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#getProfile', () => {
    it('should return mapped AthleteResponse when GET is successful', () => {
      const mockBackendResponse = {
        success: true,
        message: 'Athlete profile retrieved successfully',
        data: {
          id: 10,
          userId: 1,
          email: 'athlete@test.com',
          firstName: 'John',
          lastName: 'Doe',
          dni: '12345678',
          birthDate: '1995-05-15',
          gender: 'MALE',
          dominantHand: 'RIGHT',
          club: 'Fencing Club',
          province: 'Buenos Aires'
        }
      };

      service.getProfile().subscribe((res) => {
        expect(res.id).toBe(10);
        expect(res.gender).toBe('MASCULINO');
        expect(res.dominantHand).toBe('DIESTRO');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendResponse);
    });
  });

  describe('#createProfile', () => {
    it('should send POST request with mapped payload and return mapped AthleteResponse', () => {
      const mockRequest: AthleteRequest = {
        firstName: 'John',
        lastName: 'Doe',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'MASCULINO',
        dominantHand: 'DIESTRO',
        club: 'Fencing Club',
        province: 'Buenos Aires'
      };

      const mockBackendResponse = {
        success: true,
        message: 'Athlete profile created successfully',
        data: {
          id: 10,
          userId: 1,
          email: 'athlete@test.com',
          firstName: 'John',
          lastName: 'Doe',
          dni: '12345678',
          birthDate: '1995-05-15',
          gender: 'MALE',
          dominantHand: 'RIGHT',
          club: 'Fencing Club',
          province: 'Buenos Aires'
        }
      };

      service.createProfile(mockRequest).subscribe((res) => {
        expect(res.id).toBe(10);
        expect(res.gender).toBe('MASCULINO');
        expect(res.dominantHand).toBe('DIESTRO');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'MALE',
        dominantHand: 'RIGHT',
        club: 'Fencing Club',
        province: 'Buenos Aires'
      });
      req.flush(mockBackendResponse);
    });
  });

  describe('#updateProfile', () => {
    it('should send PUT request with mapped payload and return mapped AthleteResponse', () => {
      const mockRequest: AthleteRequest = {
        firstName: 'John',
        lastName: 'Doe',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'FEMENINO',
        dominantHand: 'ZURDO',
        club: 'Fencing Club',
        province: 'Buenos Aires'
      };

      const mockBackendResponse = {
        success: true,
        message: 'Athlete profile updated successfully',
        data: {
          id: 10,
          userId: 1,
          email: 'athlete@test.com',
          firstName: 'John',
          lastName: 'Doe',
          dni: '12345678',
          birthDate: '1995-05-15',
          gender: 'FEMALE',
          dominantHand: 'LEFT',
          club: 'Fencing Club',
          province: 'Buenos Aires'
        }
      };

      service.updateProfile(mockRequest).subscribe((res) => {
        expect(res.id).toBe(10);
        expect(res.gender).toBe('FEMENINO');
        expect(res.dominantHand).toBe('ZURDO');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'FEMALE',
        dominantHand: 'LEFT',
        club: 'Fencing Club',
        province: 'Buenos Aires'
      });
      req.flush(mockBackendResponse);
    });
  });
});
