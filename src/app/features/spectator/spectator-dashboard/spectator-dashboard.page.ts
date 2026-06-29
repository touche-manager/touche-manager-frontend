import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-spectator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './spectator-dashboard.page.html',
  styleUrls: ['./spectator-dashboard.page.css'],
})
export class SpectatorDashboardPageComponent {}
