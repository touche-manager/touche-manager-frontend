import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { PaymentSimulatorPageComponent } from './payment-simulator.page';
import { TournamentService } from '../../services/tournament.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TournamentResponse, EnrollmentResponse } from '../../../../core/models/tournament.models';

describe('PaymentSimulatorPageComponent', () => {
  let component: PaymentSimulatorPageComponent;
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let routerSpy: jasmine.SpyObj<Router>;

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
      alreadyEnrolled: true,
      enrollmentStatusLabel: 'PENDING_PAYMENT',
      enrollmentId: 123
    }
  ];

  beforeEach(async () => {
    const tournamentSpy = jasmine.createSpyObj('TournamentService', ['getAvailableTournaments', 'confirmPayment']);
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PaymentSimulatorPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { id: '123' }
            }
          }
        },
        { provide: TournamentService, useValue: tournamentSpy },
        { provide: Router, useValue: rSpy }
      ]
    }).compileComponents();

    tournamentServiceSpy = TestBed.inject(TournamentService) as jasmine.SpyObj<TournamentService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create the component and load enrollment details from query param', () => {
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));

    const fixture = TestBed.createComponent(PaymentSimulatorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.enrollmentId()).toBe(123);
    expect(component.tournamentName()).toBe('Torneo Regular');
    expect(component.amount()).toBe(1000);
    expect(component.loading()).toBeFalse();
  });

  it('should call confirmPayment and change status to SUCCESS on simulateSuccess', () => {
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));
    
    const mockEnrollResponse: EnrollmentResponse = {
      id: 123,
      athleteId: 10,
      tournamentId: 1,
      tournamentName: 'Torneo Regular',
      amount: 1000,
      status: 'PAID',
      paymentLink: ''
    };
    tournamentServiceSpy.confirmPayment.and.returnValue(of(mockEnrollResponse));

    const fixture = TestBed.createComponent(PaymentSimulatorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.simulateSuccess();

    expect(tournamentServiceSpy.confirmPayment).toHaveBeenCalledWith(123, jasmine.stringMatching(/^MP-SIM-/));
    expect(component.paymentStatus()).toBe('SUCCESS');
    expect(component.processing()).toBeFalse();
  });

  it('should change status to FAILURE on simulateSuccess error response', () => {
    tournamentServiceSpy.getAvailableTournaments.and.returnValue(of(mockTournaments));
    
    const errorResponse = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: { message: 'El arancel ya se encuentra abonado.' }
    });
    tournamentServiceSpy.confirmPayment.and.returnValue(throwError(() => errorResponse));

    const fixture = TestBed.createComponent(PaymentSimulatorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.simulateSuccess();

    expect(component.paymentStatus()).toBe('FAILURE');
    expect(component.errorMessage()).toBe('El arancel ya se encuentra abonado.');
    expect(component.processing()).toBeFalse();
  });
});
