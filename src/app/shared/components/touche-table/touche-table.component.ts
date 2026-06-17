import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToucheTableRow {
  athleteId: number;
  fullName: string;
  club: string | null;
  seriesNumber?: number;
  rank?: number;
  victories?: number;
  touchesScored?: number;
  touchesReceived?: number;
  indicator?: number;
}

@Component({
  selector: 'app-touche-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './touche-table.component.html',
})
export class ToucheTableComponent {
  @Input() mode: 'poule-classification' | 'participants' | 'final-standings' = 'poule-classification';
  @Input() rows: ToucheTableRow[] = [];
}
