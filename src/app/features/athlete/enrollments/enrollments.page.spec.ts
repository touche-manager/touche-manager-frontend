import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { EnrollmentsPageComponent } from './enrollments.page';
import { AthleteService } from '../services/athlete.service';
import { TournamentService } from '../services/tournament.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AthleteDocumentResponse } from '../../../core/models/athlete.models';
import { TournamentResponse, EnrollmentResponse } from '../../../core/models/tournament.models';

describe('EnrollmentsPageComponent', () => {
  let component: EnrollmentsPageComponent;
  let athleteServiceSpy: jasmine.SpyObj<AthleteService>;
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let routerSpy: Router;

  const mockTournaments: TournamentResponse[] = [
    {
      id: 1,
      name: 'Torneo Regular',
      weapon: 'FOIL',
      category: 'SENIOR',
      gender: 'MALE',
      location: 'Sede A',
      date: '2026-06-15',
      basePrice: 1000,
      regularDeadline: '2026-06-03',
      lateDeadline: '2026-06-07',
      currentPrice: 1000,
      enrollmentStatus: 'OPEN_REGULAR',
      alreadyEnrolled: false
    },
    {
      id: 2,
      name: 'Torneo Tardio',
      weapon: 'EPEE',
      category: 'CADET',
      gender: 'FEMALE',
      location: 'Sede B',
      date: '2026-06-09',
      basePrice: 1000,
      regularDeadline: '2026-05-27',
      lateDeadline: '2026-06-01',
      currentPrice: 1500,
      enrollmentStatus: 'OPEN_LATE',
      alreadyEnrolled: false
    }
  ];

  const mockMedicalDoc: AthleteDocumentResponse = {
    id: 1,
    athleteId: 10,
    documentType: 'MEDICAL_CLEARANCE',
    contentType: 'application/pdf',
    uploadDate: '2024-01-01T00:00:00Z'
  };

  const mockPaymentDoc: AthleteDocumentResponse = {
    id: 2,
    athleteId: 10,
    documentType: 'PAYMENT_RECEIPT',
    contentType: 'application/pdf',
    uploadDate: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const athleteSpy = jasmine.createSpyObj('AthleteService', ['getDocuments']);
    const tournamentSpy = jasmine.createSpyObj('TournamentService', ['getAvailableTournaments', 'enroll', 'cancelEnrollment']);

    await TestBed.configureTestingModule({
      imports: [EnrollmentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AthleteService, useValue: athleteSpy },
        { provide: TournamentService, useValue: tournamentSpy }
      ]
    }).compileComponents();

    athleteServiceSpy = TestBed.inject(AthleteService) as jasmine.SpyObj<AthleteService>;
    tournamentServiceSpy = TestBed.inject(TournamentService) as jasmine.SpyObj<TournamentService>;
    routerSpy = TestBed.inject(Router);
    spyOn(routerSpy, 'navigateByUrl');
    spyOn(routerSpy, 'navigate');
  });

  it('should create the component', () => {
    athleteServiceSpy.getDocuments.and.returnValue(of([]));
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));

    const fixture = TestBed.createComponent(EnrollmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.isDocsComplete()).toBeFalse(); // No docs on empty return
  });

  it('should flag isDocsComplete as true when both documents are loaded', () => {
    athleteServiceSpy.getDocuments.and.returnValue(of([mockMedicalDoc, mockPaymentDoc]));
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));

    const fixture = TestBed.createComponent(EnrollmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isDocsComplete()).toBeTrue();
    expect(component.tournaments().length).toBe(2);
  });

  it('should calculate modal regular price details correctly', () => {
    athleteServiceSpy.getDocuments.and.returnValue(of([mockMedicalDoc, mockPaymentDoc]));
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));

    const fixture = TestBed.createComponent(EnrollmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.openEnrollModal(mockTournaments[0]); // Torneo Regular

    expect(component.modalOpen()).toBeTrue();
    expect(component.selectedTournament()).toEqual(mockTournaments[0]);
    expect(component.regularPrice()).toBe(1000);
    expect(component.isLatePhase()).toBeFalse();
    expect(component.lateFee()).toBe(0);
    expect(component.totalPrice()).toBe(1000);
  });

  it('should calculate modal late price details with 50% fee correctly', () => {
    athleteServiceSpy.getDocuments.and.returnValue(of([mockMedicalDoc, mockPaymentDoc]));
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));

    const fixture = TestBed.createComponent(EnrollmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.openEnrollModal(mockTournaments[1]); // Torneo Tardio

    expect(component.modalOpen()).toBeTrue();
    expect(component.selectedTournament()).toEqual(mockTournaments[1]);
    expect(component.regularPrice()).toBe(1000);
    expect(component.isLatePhase()).toBeTrue();
    expect(component.lateFee()).toBe(500); // 50% of 1000
    expect(component.totalPrice()).toBe(1500);
  });

  it('should call enroll and navigate on confirmation success', () => {
    athleteServiceSpy.getDocuments.and.returnValue(of([mockMedicalDoc, mockPaymentDoc]));
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));

    const mockResponse: EnrollmentResponse = {
      id: 123,
      athleteId: 10,
      tournamentId: 1,
      tournamentName: 'Torneo Regular',
      amount: 1000,
      status: 'PENDING_PAYMENT',
      paymentLink: '/athlete/enrollments/pay?id=123'
    };
    tournamentServiceSpy.enroll.and.returnValue(of(mockResponse));

    const fixture = TestBed.createComponent(EnrollmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.openEnrollModal(mockTournaments[0]);
    component.confirmEnrollment();

    expect(tournamentServiceSpy.enroll).toHaveBeenCalledWith(mockTournaments[0].id);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/athlete/enrollments/pay?id=123');
    expect(component.modalOpen()).toBeFalse();
  });

  it('should open and close the cancel unenrollment modal correctly', () => {
    athleteServiceSpy.getDocuments.and.returnValue(of([mockMedicalDoc, mockPaymentDoc]));
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));

    const fixture = TestBed.createComponent(EnrollmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const tWithEnrollment: TournamentResponse = {
      ...mockTournaments[0],
      alreadyEnrolled: true,
      enrollmentId: 999,
      enrollmentStatusLabel: 'PAID'
    };

    component.openCancelModal(tWithEnrollment);

    expect(component.cancelModalOpen()).toBeTrue();
    expect(component.cancellingEnrollment()).toEqual(tWithEnrollment);

    component.closeCancelModal();

    expect(component.cancelModalOpen()).toBeFalse();
    expect(component.cancellingEnrollment()).toBeNull();
  });

  it('should call cancelEnrollment and reload data on cancel confirmation success', () => {
    athleteServiceSpy.getDocuments.and.returnValue(of([mockMedicalDoc, mockPaymentDoc]));
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));

    const mockResponse: EnrollmentResponse = {
      id: 999,
      athleteId: 10,
      tournamentId: 1,
      tournamentName: 'Torneo Regular',
      amount: 1000,
      status: 'CANCELLED',
      paymentLink: '/athlete/enrollments/pay?id=999'
    };
    tournamentServiceSpy.cancelEnrollment.and.returnValue(of(mockResponse));

    const fixture = TestBed.createComponent(EnrollmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const tWithEnrollment: TournamentResponse = {
      ...mockTournaments[0],
      alreadyEnrolled: true,
      enrollmentId: 999,
      enrollmentStatusLabel: 'PAID'
    };

    component.openCancelModal(tWithEnrollment);
    component.confirmCancellation();

    expect(tournamentServiceSpy.cancelEnrollment).toHaveBeenCalledWith(999);
    expect(component.cancelModalOpen()).toBeFalse();
    expect(athleteServiceSpy.getDocuments).toHaveBeenCalledTimes(2); // Initial + reload
  });
});
