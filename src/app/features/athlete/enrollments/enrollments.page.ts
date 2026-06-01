import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TournamentService } from '../services/tournament.service';
import { AthleteService } from '../services/athlete.service';
import { DecimalPipe } from '@angular/common';
import { TournamentResponse, WeaponLabels, CategoryLabels, GenderLabels } from '../../../core/models/tournament.models';

@Component({
  selector: 'app-enrollments-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './enrollments.page.html'
})
export class EnrollmentsPageComponent implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly athleteService = inject(AthleteService);
  private readonly router = inject(Router);

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

  // Label maps for HTML access
  readonly weaponsMap = WeaponLabels;
  readonly categoriesMap = CategoryLabels;
  readonly gendersMap = GenderLabels;

  // Calculamos recargo y total si hay un torneo seleccionado
  readonly regularPrice = computed(() => this.selectedTournament()?.basePrice || 0);
  readonly isLatePhase = computed(() => this.selectedTournament()?.enrollmentStatus === 'OPEN_LATE');
  readonly lateFee = computed(() => this.isLatePhase() ? this.regularPrice() * 0.5 : 0);
  readonly totalPrice = computed(() => this.regularPrice() + this.lateFee());

  ngOnInit(): void {
    this.loadData();
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
        // Redirigir al link de pago simulado
        this.router.navigateByUrl(res.paymentLink);
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
    this.router.navigate(['/athlete/enrollments/pay'], { queryParams: { id: enrollmentId } });
  }
}
