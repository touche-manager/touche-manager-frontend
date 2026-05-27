import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AthleteService } from '../services/athlete.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.page.html'
})
export class DashboardPageComponent implements OnInit {
  private readonly athleteService = inject(AthleteService);
  private readonly router = inject(Router);

  readonly profileExists = signal<boolean | null>(null);
  readonly hasMedicalClearance = signal<boolean>(false);
  readonly hasPaymentReceipt = signal<boolean>(false);
  readonly isDocumentationComplete = signal<boolean>(false);
  readonly loading = signal<boolean>(true);

  ngOnInit(): void {
    this.athleteService.getProfile().subscribe({
      next: () => {
        this.profileExists.set(true);
        this.athleteService.getDocuments().subscribe({
          next: (docs) => {
            const hasClearance = docs.some(d => d.documentType === 'MEDICAL_CLEARANCE');
            const hasPayment = docs.some(d => d.documentType === 'PAYMENT_RECEIPT');
            this.hasMedicalClearance.set(hasClearance);
            this.hasPaymentReceipt.set(hasPayment);
            this.isDocumentationComplete.set(hasClearance && hasPayment);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.profileExists.set(false);
        }
        this.loading.set(false);
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/athlete/profile']);
  }
}
