import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from './services/admin.service';
import { AdminStatsResponse } from '../../core/models/admin.models';
import { UserListComponent } from './components/user-list/user-list.component';
import { DocumentReviewComponent } from './components/document-review/document-review.component';
import { TournamentOversightComponent } from './components/tournament-oversight/tournament-oversight.component';

type AdminTab = 'users' | 'documents' | 'tournaments';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, UserListComponent, DocumentReviewComponent, TournamentOversightComponent],
  template: `
    <div class="bg-white min-h-full">
      <div class="max-w-5xl mx-auto py-2">

        <!-- Header -->
        <div class="mb-6">
          <h1 class="font-display text-3xl font-bold text-touche-navy">Panel de Administración</h1>
          <p class="text-sm text-touche-navy/60 mt-1">
            Gestión de usuarios, validación de documentos y supervisión de torneos.
          </p>
        </div>

        <!-- Stats -->
        @if (stats(); as s) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-touche-navy">{{ s.totalUsers }}</p>
              <p class="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">Usuarios</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-touche-celeste">{{ s.totalAthletes }}</p>
              <p class="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">Atletas</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-touche-gold">{{ s.activeTournaments }}</p>
              <p class="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">Torneos activos</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold" [class]="s.pendingDocuments > 0 ? 'text-touche-alert' : 'text-emerald-600'">
                {{ s.pendingDocuments }}
              </p>
              <p class="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">Docs pendientes</p>
            </div>
          </div>
        }

        <!-- Tabs -->
        <div class="flex border-b border-slate-200 mb-6">
          <button
            id="tab-admin-users"
            (click)="activeTab.set('users')"
            class="relative px-5 py-3 text-sm font-semibold transition-colors duration-150 focus:outline-none"
            [class.text-touche-navy]="activeTab() === 'users'"
            [class.text-slate-400]="activeTab() !== 'users'"
          >
            Usuarios
            @if (activeTab() === 'users') {
              <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-touche-celeste rounded-t-full"></span>
            }
          </button>
          <button
            id="tab-admin-documents"
            (click)="activeTab.set('documents')"
            class="relative px-5 py-3 text-sm font-semibold transition-colors duration-150 focus:outline-none"
            [class.text-touche-navy]="activeTab() === 'documents'"
            [class.text-slate-400]="activeTab() !== 'documents'"
          >
            Documentos
            @if (activeTab() === 'documents') {
              <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-touche-celeste rounded-t-full"></span>
            }
          </button>
          <button
            id="tab-admin-tournaments"
            (click)="activeTab.set('tournaments')"
            class="relative px-5 py-3 text-sm font-semibold transition-colors duration-150 focus:outline-none"
            [class.text-touche-navy]="activeTab() === 'tournaments'"
            [class.text-slate-400]="activeTab() !== 'tournaments'"
          >
            Torneos
            @if (activeTab() === 'tournaments') {
              <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-touche-celeste rounded-t-full"></span>
            }
          </button>
        </div>

        @switch (activeTab()) {
          @case ('users') { <app-admin-user-list /> }
          @case ('documents') { <app-admin-document-review /> }
          @case ('tournaments') { <app-admin-tournament-oversight /> }
        }
      </div>
    </div>
  `
})
export class AdminPageComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly stats = signal<AdminStatsResponse | null>(null);
  readonly activeTab = signal<AdminTab>('users');

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {}
    });
  }
}
