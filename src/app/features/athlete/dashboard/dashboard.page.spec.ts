import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DashboardPageComponent } from './dashboard.page';
import { AthleteService } from '../services/athlete.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AthleteResponse, AthleteDocumentResponse } from '../../../core/models/athlete.models';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let athleteServiceSpy: jasmine.SpyObj<AthleteService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockProfile: AthleteResponse = {
    id: 1,
    userId: 1,
    email: 'athlete@test.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '12345678',
    birthDate: '1995-05-15',
    gender: 'MASCULINO',
    dominantHand: 'DIESTRO',
    club: 'Club Esgrima',
    province: 'Córdoba'
  };

  const mockMedicalDoc: AthleteDocumentResponse = {
    id: 1,
    athleteId: 1,
    documentType: 'MEDICAL_CLEARANCE',
    fileName: 'medical.pdf',
    contentType: 'application/pdf',
    uploadDate: '2024-01-01T00:00:00Z'
  };

  const mockPaymentDoc: AthleteDocumentResponse = {
    id: 2,
    athleteId: 1,
    documentType: 'PAYMENT_RECEIPT',
    fileName: 'payment.pdf',
    contentType: 'application/pdf',
    uploadDate: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const athleteSpy = jasmine.createSpyObj('AthleteService', [
      'getProfile',
      'getDocuments'
    ]);
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        { provide: AthleteService, useValue: athleteSpy },
        { provide: Router, useValue: rSpy }
      ]
    }).compileComponents();

    athleteServiceSpy = TestBed.inject(AthleteService) as jasmine.SpyObj<AthleteService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create the component', () => {
    athleteServiceSpy.getProfile.and.returnValue(of(mockProfile));
    athleteServiceSpy.getDocuments.and.returnValue(of([]));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should set profileExists to false when profile returns 404', () => {
    const errorResponse = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    athleteServiceSpy.getProfile.and.returnValue(throwError(() => errorResponse));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.profileExists()).toBeFalse();
    expect(component.loading()).toBeFalse();
  });

  it('should set hasMedicalClearance to false when profile exists but no medical doc', () => {
    athleteServiceSpy.getProfile.and.returnValue(of(mockProfile));
    athleteServiceSpy.getDocuments.and.returnValue(of([mockPaymentDoc]));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.profileExists()).toBeTrue();
    expect(component.hasMedicalClearance()).toBeFalse();
    expect(component.loading()).toBeFalse();
  });

  it('should set hasMedicalClearance to true when profile exists and has MEDICAL_CLEARANCE doc', () => {
    athleteServiceSpy.getProfile.and.returnValue(of(mockProfile));
    athleteServiceSpy.getDocuments.and.returnValue(of([mockMedicalDoc, mockPaymentDoc]));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.profileExists()).toBeTrue();
    expect(component.hasMedicalClearance()).toBeTrue();
    expect(component.loading()).toBeFalse();
  });
});
