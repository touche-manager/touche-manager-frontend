/**
 * filter-options.ts
 *
 * Pre-built option arrays for use in select/dropdown inputs across the app.
 * Derived from label.maps.ts — no need to repeat labels in each component.
 *
 * Usage:
 *   import { WEAPON_OPTIONS, CATEGORY_OPTIONS, GENDER_OPTIONS } from '@shared/utils/filter-options';
 *
 *   // In template:
 *   @for (opt of WEAPON_OPTIONS; track opt.value) {
 *     <option [value]="opt.value">{{ opt.label }}</option>
 *   }
 */

import {
  WEAPON_LABELS,     Weapon,
  CATEGORY_LABELS,   TournamentCategory,
  GENDER_LABELS,     Gender,
  DOMINANT_HAND_LABELS, DominantHand,
  TOURNAMENT_PHASE_LABELS, TournamentPhase,
  ENROLLMENT_STATUS_LABELS, EnrollmentStatus,
} from './label.maps';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

/** Helper to build option arrays from a label map */
function toOptions<T extends string>(map: Record<T, string>): SelectOption<T>[] {
  return (Object.entries(map) as [T, string][]).map(([value, label]) => ({ value, label }));
}

export const WEAPON_OPTIONS:   SelectOption<Weapon>[]             = toOptions(WEAPON_LABELS);
export const CATEGORY_OPTIONS: SelectOption<TournamentCategory>[] = toOptions(CATEGORY_LABELS);
export const GENDER_OPTIONS:   SelectOption<Gender>[]             = toOptions(GENDER_LABELS);
export const HAND_OPTIONS:     SelectOption<DominantHand>[]       = toOptions(DOMINANT_HAND_LABELS);
export const PHASE_OPTIONS:    SelectOption<TournamentPhase>[]    = toOptions(TOURNAMENT_PHASE_LABELS);
export const ENROLLMENT_STATUS_OPTIONS: SelectOption<EnrollmentStatus>[] = toOptions(ENROLLMENT_STATUS_LABELS);
