import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface PouleTableAthlete {
  id: number;
  fullName: string;
}

export interface PouleTableCell {
  text: string;
  cssClass: string;
  /** If set, the cell renders as a link to /live/bout/:boutId */
  boutId?: number;
}

export interface PouleTableStats {
  victories: number | string;
  touchesScored: number | string;
  touchesReceived: number | string;
  indicator: string;
  classification: string;
}

export interface PouleTableRowData {
  index: number;
  athlete: PouleTableAthlete;
  cells: PouleTableCell[];
  stats: PouleTableStats;
}

@Component({
  selector: 'app-poule-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './poule-table.component.html',
  styleUrls: ['./poule-table.component.css']
})
export class PouleTableComponent {
  @Input() rows: PouleTableRowData[] = [];
  @Input() colCount = 0;

  getColIndexes(): number[] {
    return Array.from({ length: this.colCount }, (_, i) => i + 1);
  }
}
