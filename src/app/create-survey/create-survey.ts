import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CategorySelect } from '../category-select/category-select';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../supabase';
import { NewSurvey } from '../interfaces/survey.interface';
import { MAX_OPTIONS, MAX_QUESTIONS } from '../constants/limits';

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, RouterLink, CategorySelect],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {
  private fb = inject(FormBuilder);
  private db = inject(Supabase);
  private router = inject(Router);
  private createdId = 0;
  toast = viewChild<ElementRef<HTMLDialogElement>>('toast');
  saving = signal(false);
  error = signal('');
  maxQuestions = MAX_QUESTIONS;
  maxOptions = MAX_OPTIONS;
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
   * Removes a question. The first question is only cleared.
   * @param qi Index of the question.
   */
  removeQuestion(qi: number): void {
    if (qi === 0) this.resetQuestion(0);
    else this.questions.removeAt(qi);
  }

  /**
   * Clears the text and all answers of a question.
   * Multiple choice is unchecked and the question keeps two empty answers.
   * @param qi Index of the question.
   */
  resetQuestion(qi: number): void {
    const question = this.questions.at(qi);
    question.reset();
    while (question.controls.options.length > 2) {
      question.controls.options.removeAt(2);
    }
  }

  /**
   * Adds an empty answer to a question until the maximum is reached.
   * @param qi Index of the question.
   */
  addOption(qi: number): void {
    const options = this.questions.at(qi).controls.options;
    if (options.length < this.maxOptions) options.push(this.newOption());
  }

  /**
   * Clears an answer. An already empty answer is removed,
   * except for the first two answers, which always stay.
   * @param qi Index of the question.
   * @param oi Index of the answer.
   */
  clearOption(qi: number, oi: number): void {
    const options = this.questions.at(qi).controls.options;
    if (oi >= 2 && options.at(oi).value === '') options.removeAt(oi);
    else options.at(oi).setValue('');
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
      const survey = await this.db.createSurvey(this.toSurvey());
      this.createdId = survey.id;
      this.showToast();
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

  /**
 * Stores the selected category in the form.
 * @param category The selected category.
 */
  setCategory(category: string): void {
    this.form.controls.category.setValue(category);
    this.form.controls.category.markAsTouched();
  }

  /** Shows the success dialog and closes it automatically after 3 seconds. */
  showToast(): void {
    this.toast()?.nativeElement.showModal();
    setTimeout(() => this.toast()?.nativeElement.close(), 3000);
  }

  /** Navigates to the newly created survey. */
  leave(): void {
    this.router.navigate(['/survey', this.createdId]);
  }
}