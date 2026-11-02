import { Survey } from '../interfaces/survey.interface';

/**
 * Checks whether a survey is still running.
 * @param survey The survey to check.
 * @returns True if there is no end date or it lies in the future.
 */
export function isActive(survey: Survey): boolean {
  return !survey.end_date || new Date(survey.end_date) > new Date();
}