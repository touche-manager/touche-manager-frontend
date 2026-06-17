import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Normalized data model for a single bout card in any bracket context. */
export interface BracketCardData {
  id: number;
  bracketPosition: number;
  leftName: string;
  leftSeed: number | null;
  rightName: string | null;   // null means BYE
  rightSeed: number | null;
  scoreLeft: number | null;
  scoreRight: number | null;
  winnerId: number | null;    // null in read-only results mode
  leftId: number | null;      // null in read-only results mode
  rightId: number | null;     // null in read-only results mode
  winnerSide: 'left' | 'right' | null; // derived from winnerId or winnerName
  piste: string | null;
  refereeLabel: string | null; // first referee name, if any
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
}

export interface BracketRoundData {
  roundKey: string;
  label: string;
  bouts: BracketCardData[];
}

@Component({
  selector: 'app-bracket-round-column',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bracket-round-column.component.html',
})
export class BracketRoundColumnComponent {
  /** All rounds of the bracket, rendered as side-by-side columns. */
  @Input() rounds: BracketRoundData[] = [];

  /**
   * When true the cards are read-only (no click, no status footer label).
   * Use in the results page where every bout is already finished.
   */
  @Input() readOnly = false;

  /** Emits the card that was clicked (only when readOnly=false). */
  @Output() cardClick = new EventEmitter<BracketCardData>();

  cardClass(card: BracketCardData): string {
    const base = 'bg-white border rounded-xl overflow-hidden transition-all select-none relative';
    const cursor = this.readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:border-touche-celeste';
    const border = card.status === 'FINISHED'
      ? 'border-emerald-200'
      : card.status === 'IN_PROGRESS'
        ? 'border-amber-200'
        : 'border-slate-150';
    return `${base} ${cursor} ${border}`;
  }

  onCardClick(card: BracketCardData): void {
    if (!this.readOnly) this.cardClick.emit(card);
  }

}
