import { Survey } from '../interfaces/survey.interface';

/**
 * Checks whether a survey is still running.
 * @param survey The survey to check.
 * @returns True if there is no end date or it lies in the future.
 */
export function isActive(survey: Survey): boolean {
  return !survey.end_date || new Date(survey.end_date) > new Date();
}

/**
 * Returns the letter label of an answer.
 * @param index Index of the answer.
 * @returns A, B, C and so on.
 */
export function letter(index: number): string {
  return String.fromCharCode(65 + index);
}