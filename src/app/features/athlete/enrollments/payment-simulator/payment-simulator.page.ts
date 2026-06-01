import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TournamentService } from '../../services/tournament.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-payment-simulator-page',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './payment-simulator.page.html'
})
export class PaymentSimulatorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);

  readonly enrollmentId = signal<number | null>(null);
  readonly tournamentName = signal<string>('Inscripción a Torneo Touché');
  readonly amount = signal<number>(0);
  readonly loading = signal<boolean>(true);
  readonly processing = signal<boolean>(false);
  readonly paymentStatus = signal<'IDLE' | 'SUCCESS' | 'FAILURE'>('IDLE');
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.queryParams['id'];
    if (idParam) {
      const id = Number(idParam);
      this.enrollmentId.set(id);
      this.loadEnrollmentDetails(id);
    } else {
      this.loading.set(false);
      this.errorMessage.set('Falta el ID de inscripción');
    }
  }

  loadEnrollmentDetails(id: number): void {
    this.loading.set(true);
    this.tournamentService.getAvailableTournaments().subscribe({
      next: (tournaments) => {
        const match = tournaments.find(t => t.enrollmentId === id);
        if (match) {
          this.tournamentName.set(match.name);
          this.amount.set(match.currentPrice);
        } else {
          // Si no lo encuentra en la grilla directa (por ejemplo, si ya está pagado), podemos dejar los valores por defecto
          this.tournamentName.set('Inscripción a Torneo (Copa Seeded)');
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  simulateSuccess(): void {
    const id = this.enrollmentId();
    if (!id) return;

    this.processing.set(true);
    this.errorMessage.set(null);

    const mockPaymentId = 'MP-SIM-' + Math.floor(100000 + Math.random() * 900000);

    this.tournamentService.confirmPayment(id, mockPaymentId).subscribe({
      next: () => {
        this.processing.set(false);
        this.paymentStatus.set('SUCCESS');
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/athlete/enrollments']);
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(false);
        this.paymentStatus.set('FAILURE');
        this.errorMessage.set(err.error?.message || 'Error al procesar el pago.');
      }
    });
  }

  simulateFailure(): void {
    this.processing.set(true);
    this.errorMessage.set(null);

    setTimeout(() => {
      this.processing.set(false);
      this.paymentStatus.set('FAILURE');
      this.errorMessage.set('El pago fue rechazado por la entidad emisora de la tarjeta.');
    }, 1000);
  }

  retry(): void {
    this.paymentStatus.set('IDLE');
    this.errorMessage.set(null);
  }

  cancel(): void {
    this.router.navigate(['/athlete/enrollments']);
  }
}
