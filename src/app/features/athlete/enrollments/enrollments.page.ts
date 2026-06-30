import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TournamentService } from '../services/tournament.service';
import { AthleteService } from '../services/athlete.service';
import { DecimalPipe, NgClass } from '@angular/common';
import { TournamentResponse } from '../../../core/models/tournament.models';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

@Component({
  selector: 'app-enrollments-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, NgClass, LabelPipe],
  templateUrl: './enrollments.page.html'
})
export class EnrollmentsPageComponent implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly athleteService = inject(AthleteService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tournaments = signal<TournamentResponse[]>([]);
  readonly loading = signal<boolean>(true);
  readonly isDocsComplete = signal<boolean>(true);
  readonly selectedTournament = signal<TournamentResponse | null>(null);
  readonly modalOpen = signal<boolean>(false);
  readonly cancelModalOpen = signal<boolean>(false);
  readonly cancellingEnrollment = signal<TournamentResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly registering = signal<boolean>(false);
  readonly cancelling = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);

  // Labels are handled by LabelPipe in the template

  // Calculamos recargo y total si hay un torneo seleccionado
  readonly regularPrice = computed(() => this.selectedTournament()?.basePrice || 0);
  readonly isLatePhase = computed(() => this.selectedTournament()?.enrollmentStatus === 'OPEN_LATE');
  readonly lateFee = computed(() => this.isLatePhase() ? this.regularPrice() * 0.5 : 0);
  readonly totalPrice = computed(() => this.regularPrice() + this.lateFee());

  ngOnInit(): void {
    this.loadData();
    this.checkPaymentStatus();
  }

  checkPaymentStatus(): void {
    const params = this.route.snapshot.queryParams;
    const paymentStatus = params['paymentStatus'];
    if (paymentStatus) {
      if (paymentStatus === 'success') {
        this.successMessage.set('¡Inscripción confirmada! Tu pago ha sido procesado con éxito.');
        setTimeout(() => this.successMessage.set(null), 8000);

        // Fallback: if the webhook didn't reach the backend (e.g. ngrok not running),
        // confirm the payment using the payment_id returned by Mercado Pago in the redirect URL.
        const paymentId = params['payment_id'] ?? params['collection_id'];
        if (paymentId) {
          this.tournamentService.confirmPaymentFromRedirect(paymentId).subscribe({
            next: () => {
              // Reload after a short delay to allow the DB update to propagate
              setTimeout(() => this.loadData(), 1000);
            },
            error: (err) => {
              // Non-fatal: webhook may have already handled it
              console.warn('Redirect payment confirmation returned error (may already be handled by webhook):', err);
            }
          });
        }
      } else if (paymentStatus === 'failure') {
        this.errorMessage.set('El pago no pudo procesarse. Por favor, intenta de nuevo.');
        setTimeout(() => this.errorMessage.set(null), 8000);
      } else if (paymentStatus === 'pending') {
        this.successMessage.set('Tu pago está siendo procesado por Mercado Pago. Se acreditará en unos instantes.');
        setTimeout(() => this.successMessage.set(null), 8000);
      }

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { paymentStatus: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  loadData(): void {
    this.loading.set(true);

    // 1. Verificar documentación
    this.athleteService.getDocuments().subscribe({
      next: (docs) => {
        const hasMedical = docs.some(d => d.documentType === 'MEDICAL_CLEARANCE');
        const hasPayment = docs.some(d => d.documentType === 'PAYMENT_RECEIPT');
        this.isDocsComplete.set(hasMedical && hasPayment);

        // 2. Cargar torneos
        this.tournamentService.getAvailableTournaments().subscribe({
          next: (data) => {
            this.tournaments.set(data);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.isDocsComplete.set(false);
        this.loading.set(false);
      }
    });
  }

  openEnrollModal(tournament: TournamentResponse): void {
    if (!this.isDocsComplete()) return;
    this.selectedTournament.set(tournament);
    this.modalOpen.set(true);
  }

  closeEnrollModal(): void {
    this.modalOpen.set(false);
    this.selectedTournament.set(null);
    this.errorMessage.set(null);
  }

  confirmEnrollment(): void {
    const tournament = this.selectedTournament();
    if (!tournament) return;

    this.registering.set(true);
    this.errorMessage.set(null);

    this.tournamentService.enroll(tournament.id).subscribe({
      next: (res) => {
        this.registering.set(false);
        this.closeEnrollModal();

        if (res.status === 'PAID') {
          // Re-inscripción de un pago previo: ya quedó confirmado, sin pasar por MP
          this.successMessage.set(`Tu inscripción en "${tournament.name}" fue reactivada exitosamente. Tu pago anterior ya estaba registrado.`);
          setTimeout(() => this.successMessage.set(null), 6000);
          this.loadData();
        } else {
          // Primera inscripción o reinscripción sin pago previo: ir al flujo de pago
          if (res.paymentLink.startsWith('http://') || res.paymentLink.startsWith('https://')) {
            window.location.href = res.paymentLink;
          } else {
            this.router.navigateByUrl(res.paymentLink);
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        this.registering.set(false);
        const msg = err.error?.message || 'Ocurrió un error al procesar tu inscripción. Intenta de nuevo.';
        this.errorMessage.set(msg);
      }
    });
  }

  openCancelModal(tournament: TournamentResponse): void {
    this.cancellingEnrollment.set(tournament);
    this.cancelModalOpen.set(true);
    this.errorMessage.set(null);
  }

  closeCancelModal(): void {
    this.cancelModalOpen.set(false);
    this.cancellingEnrollment.set(null);
    this.errorMessage.set(null);
  }

  confirmCancellation(): void {
    const tournament = this.cancellingEnrollment();
    if (!tournament || !tournament.enrollmentId) return;

    this.cancelling.set(true);
    this.errorMessage.set(null);

    this.tournamentService.cancelEnrollment(tournament.enrollmentId).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.closeCancelModal();
        this.loadData();
      },
      error: (err: HttpErrorResponse) => {
        this.cancelling.set(false);
        const msg = err.error?.message || 'Ocurrió un error al procesar tu desinscripción. Intenta de nuevo.';
        this.errorMessage.set(msg);
      }
    });
  }

  payDirectly(enrollmentId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.tournamentService.getPaymentLink(enrollmentId).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.paymentLink.startsWith('http://') || res.paymentLink.startsWith('https://')) {
          window.location.href = res.paymentLink;
        } else {
          this.router.navigate(['/athlete/enrollments/pay'], { queryParams: { id: enrollmentId } });
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se pudo obtener el link de pago. Intenta nuevamente.');
      }
    });
  }
}
