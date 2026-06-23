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
  templateUrl: './admin.page.html'
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
