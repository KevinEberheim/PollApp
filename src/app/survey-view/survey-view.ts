import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from '../supabase';
import { NewVote, Question, QuestionResult, Survey, Vote } from '../interfaces/survey.interface';
import { isActive, letter } from '../utils/survey.utils';

@Component({
  selector: 'app-survey-view',
  imports: [DatePipe, RouterLink],
  templateUrl: './survey-view.html',
  styleUrl: './survey-view.scss',
})
export class SurveyView implements OnInit, OnDestroy {
  private db = inject(Supabase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private channel?: RealtimeChannel;
  letter = letter;
  survey = signal<Survey | null>(null);
  votes = signal<Vote[]>([]);
  selected = signal<number[][]>([]);
  submitted = signal(false);
  error = signal('');
  running = computed(() => {
    const survey = this.survey();
    return !!survey && isActive(survey);
  });
  locked = computed(() => this.submitted() || !this.running());
  hasVotes = computed(() => this.votes().length > 0);
  results = computed(() => {
    const survey = this.survey();
    return survey ? survey.questions.map((q, qi) => this.toResult(q, qi)) : [];
  });
  resultsOpen = signal(true);

  /** Loads the survey and its votes and starts the realtime subscription. */
  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.channel = this.db.subscribeToVotes(id, (vote) => this.addVote(vote));
    try {
      const survey = await this.db.getSurvey(id);
      this.votes.set(await this.db.getVotes(id));
      this.selected.set(survey.questions.map(() => []));
      this.survey.set(survey);
    } catch {
      this.router.navigateByUrl('/');
    }
  }

  /** Stops the realtime subscription. */
  ngOnDestroy(): void {
    if (this.channel) this.db.unsubscribe(this.channel);
  }

  /**
   * Adds a vote received in real time, ignoring duplicates.
   * @param vote The new vote.
   */
  addVote(vote: Vote): void {
    this.votes.update((all) => (all.some((v) => v.id === vote.id) ? all : [...all, vote]));
  }

  /**
   * Calculates the percentage of each answer of a question.
   * @param question The question.
   * @param qi Index of the question.
   * @returns The result with one percentage per answer.
   */
  toResult(question: Question, qi: number): QuestionResult {
    const votes = this.votes().filter((v) => v.question_index === qi);
    const options = question.options.map((label, oi) => {
      const count = votes.filter((v) => v.option_index === oi).length;
      return { label, percent: votes.length ? Math.round((count / votes.length) * 100) : 0 };
    });
    return { text: question.text, options };
  }

  /**
   * Checks whether an answer is currently selected.
   * @param qi Index of the question.
   * @param oi Index of the answer.
   * @returns True if selected.
   */
  isSelected(qi: number, oi: number): boolean {
    return this.selected()[qi]?.includes(oi) ?? false;
  }

  /**
   * Selects or deselects an answer. Single choice keeps only one answer.
   * @param qi Index of the question.
   * @param oi Index of the answer.
   */
  toggle(qi: number, oi: number): void {
    if (this.locked()) return;
    const multiple = this.survey()?.questions[qi].multiple_choice ?? false;
    this.selected.update((all) => all.map((list, i) => (i === qi ? this.next(list, oi, multiple) : list)));
  }

  /**
   * Calculates the new selection of one question.
   * @param list The currently selected answers.
   * @param oi The clicked answer.
   * @param multiple Whether several answers are allowed.
   * @returns The new selection.
   */
  next(list: number[], oi: number, multiple: boolean): number[] {
    if (list.includes(oi)) return list.filter((o) => o !== oi);
    return multiple ? [...list, oi] : [oi];
  }

  /**
   * Converts the selection into votes for the database.
   * @returns One vote per selected answer.
   */
  toVotes(): NewVote[] {
    const survey_id = this.survey()?.id ?? 0;
    return this.selected().flatMap((list, question_index) =>
      list.map((option_index) => ({ survey_id, question_index, option_index }))
    );
  }

  /** Saves the selected answers and locks the survey for this page view. */
  async complete(): Promise<void> {
    const votes = this.toVotes();
    if (this.locked() || !votes.length) return;
    this.submitted.set(true);
    this.error.set('');
    try {
      await this.db.addVotes(votes);
    } catch {
      this.submitted.set(false);
      this.error.set('Your answers could not be saved. Please try again.');
    }
  }

  /** Opens or closes the results on small screens. */
  toggleResults(): void {
    this.resultsOpen.update((value) => !value);
  }
}