import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'endsIn' })
export class EndsInPipe implements PipeTransform {
  /**
   * Converts an end date into a readable remaining time.
   * @param endDate The end date as ISO string or null.
   * @returns Text like "Ends in 2 Days", "Ended" or "No deadline".
   */
  transform(endDate: string | null): string {
    if (!endDate) return 'No deadline';
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    if (days <= 0) return 'Ended';
    return `Ends in ${days} ${days === 1 ? 'Day' : 'Days'}`;
  }
}