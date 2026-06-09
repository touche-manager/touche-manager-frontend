/**
 * label.pipe.ts
 *
 * Angular pipe that translates backend enum values to Spanish display labels.
 * Eliminates the need for getXxxLabel() helper methods in each component.
 *
 * Usage in template:
 *   {{ tournament.weapon   | label:'weapon'   }}   → 'Florete'
 *   {{ tournament.category | label:'category' }}   → 'Mayores'
 *   {{ tournament.gender   | label:'gender'   }}   → 'Masculino'
 *   {{ bout.eliminationRound | label:'eliminationRound' }}  → 'Semifinales'
 *
 * The pipe is standalone and must be imported in each component/module that uses it.
 * It is also exported from SharedModule for bulk imports.
 *
 * If the key is unknown or null/undefined, the original value is returned as-is
 * (no crash, no empty string).
 */

import { Pipe, PipeTransform } from '@angular/core';
import { LABEL_MAPS, LabelMapKey } from '../utils/label.maps';

@Pipe({
  name: 'label',
  standalone: true,
  pure: true, // values never mutate at runtime → safe to keep pure
})
export class LabelPipe implements PipeTransform {
  transform(value: string | null | undefined, mapKey: LabelMapKey): string {
    if (value == null) return '';
    const map = LABEL_MAPS[mapKey];
    return map?.[value] ?? value;
  }
}
