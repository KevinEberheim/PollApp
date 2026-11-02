import { Component, inject, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../supabase';
import { NewSurvey } from '../interfaces/survey.interface';
import { CATEGORIES } from '../constants/categories';
import { MAX_QUESTIONS } from '../constants/limits';

@Component({
  selector: 'app-survey-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './survey-dialog.html',
  styleUrl: './survey-dialog.scss',
})
export class SurveyDialog {
  private fb = inject(FormBuilder);
  private db = inject(Supabase);
  closed = output<void>();
  published = output<void>();
  saving = signal(false);
  error = signal('');
  categories = CATEGORIES;
  maxQuestions = MAX_QUESTIONS;
  today = new Date().toLocaleDateString('sv-SE');
  required = [Validators.required, Validators.pattern(/\S/)];
  questions = this.fb.array([this.newQuestion()]);
  form = this.fb.nonNullable.group({
    title: ['', this.required],
    description: [''],
    end_date: [''],
    category: ['', Validators.required],
    questions: this.questions,
  });

  /**
   * Creates an empty question with two empty answers.
   * @returns The form group of a question.
   */
  newQuestion() {
    return this.fb.nonNullable.group({
      text: ['', this.required],
      multiple_choice: false,
      options: this.fb.array([this.newOption(), this.newOption()]),
    });
  }

  /**
   * Creates an empty answer control.
   * @returns The form control of an answer.
   */
  newOption() {
    return this.fb.nonNullable.control('', this.required);
  }

  /** Adds a question until the maximum is reached. */
  addQuestion(): void {
    if (this.questions.length < this.maxQuestions) this.questions.push(this.newQuestion());
  }

  /**
   * Removes a question. The last remaining question is only cleared.
   * @param qi Index of the question.
   */
  removeQuestion(qi: number): void {
    if (this.questions.length > 1) this.questions.removeAt(qi);
    else this.questions.at(qi).reset();
  }

  /**
   * Adds an empty answer to a question.
   * @param qi Index of the question.
   */
  addOption(qi: number): void {
    this.questions.at(qi).controls.options.push(this.newOption());
  }

  /**
   * Removes an answer. With only two answers left, it is only cleared.
   * @param qi Index of the question.
   * @param oi Index of the answer.
   */
  removeOption(qi: number, oi: number): void {
    const options = this.questions.at(qi).controls.options;
    if (options.length > 2) options.removeAt(oi);
    else options.at(oi).reset();
  }

  /**
   * Clears a single text field of the form.
   * @param name Name of the control.
   */
  clear(name: 'title' | 'description' | 'end_date'): void {
    this.form.controls[name].setValue('');
  }

  /**
   * Returns the letter label of an answer.
   * @param index Index of the answer.
   * @returns A, B, C and so on.
   */
  letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /**
   * Checks whether a control should show an error.
   * @param control The control to check.
   * @returns True if it is invalid and was touched.
   */
  isInvalid(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  /** Validates the form and saves the survey. */
  async publish(): Promise<void> {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.saving.set(true);
    this.error.set('');
    try {
      await this.db.createSurvey(this.toSurvey());
      this.published.emit();
    } catch {
      this.error.set('Survey could not be saved. Please try again.');
    }
    this.saving.set(false);
  }

  /**
   * Converts the form value into a survey for the database.
   * @returns The survey without id and creation date.
   */
  toSurvey(): NewSurvey {
    const v = this.form.getRawValue();
    return {
      title: v.title.trim(),
      description: v.description.trim() || null,
      category: v.category,
      end_date: v.end_date ? new Date(`${v.end_date}T23:59:59`).toISOString() : null,
      questions: v.questions.map((q) => ({
        text: q.text.trim(),
        multiple_choice: q.multiple_choice,
        options: q.options.map((o) => o.trim()),
      })),
    };
  }
}