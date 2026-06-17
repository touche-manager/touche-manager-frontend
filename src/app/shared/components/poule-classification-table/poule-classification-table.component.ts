import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PouleClassificationRow {
  athleteId: number;
  fullName: string;
  club: string | null;
  victories: number;
  touchesScored: number;
  touchesReceived: number;
  indicator: number;
  rank?: number;
}

@Component({
  selector: 'app-poule-classification-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poule-classification-table.component.html',
})
export class PouleClassificationTableComponent {
  @Input() rows: PouleClassificationRow[] = [];
}
