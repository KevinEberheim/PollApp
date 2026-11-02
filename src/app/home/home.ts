import { Component, OnInit, computed, signal } from '@angular/core';
import { Supabase } from '../supabase';
import { Survey } from '../interfaces/survey.interface';
import { CATEGORIES } from '../constants/categories';
import { isActive } from '../utils/survey.utils';
import { SurveyCard } from '../survey-card/survey-card';
import { SurveyItem } from '../survey-item/survey-item';
import { SurveyDialog } from '../survey-dialog/survey-dialog';

@Component({
  selector: 'app-home',
  imports: [SurveyCard, SurveyItem, SurveyDialog],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  surveys = signal<Survey[]>([]);
  tab = signal<'active' | 'past'>('active');
  category = signal('All');
  categories = CATEGORIES;
  active = computed(() => this.surveys().filter(isActive));
  past = computed(() => this.surveys().filter((s) => !isActive(s)));
  endingSoon = computed(() => this.active().filter((s) => s.end_date).slice(0, 3));
  visible = computed(() =>
    this.filterByCategory(this.tab() === 'active' ? this.active() : this.past())
  );
  open = signal(false);
  dialogOpen = signal(false);
  toast = signal(false);

  constructor(private db: Supabase) { }

  /** Loads all surveys when the component is initialized. */
  async ngOnInit(): Promise<void> {
    this.surveys.set(await this.db.getSurveys());
  }

  /**
   * Filters a list by the selected category.
   * @param list The surveys to filter.
   * @returns The surveys of the selected category, or all for "All".
   */
  filterByCategory(list: Survey[]): Survey[] {
    const selected = this.category();
    return selected === 'All' ? list : list.filter((s) => s.category === selected);
  }

  /** Opens or closes the category dropdown. */
  toggleMenu(): void {
    this.open.update((value) => !value);
  }

  /**
   * Selects a category and closes the dropdown.
   * @param category The category name or "All".
   */
  selectCategory(category: string): void {
    this.category.set(category);
    this.open.set(false);
  }

  /**
   * Switches the tab, resets the category filter and closes the dropdown.
   * @param tab The tab to show.
   */
  setTab(tab: 'active' | 'past'): void {
    this.tab.set(tab);
    this.selectCategory('All');
  }

  /** Opens the survey dialog. */
  openDialog(): void {
    this.dialogOpen.set(true);
  }

  /** Closes the survey dialog. */
  closeDialog(): void {
    this.dialogOpen.set(false);
  }

  /** Closes the dialog, reloads the surveys and shows the toast. */
  async onPublished(): Promise<void> {
    this.closeDialog();
    this.surveys.set(await this.db.getSurveys());
    this.toast.set(true);
    setTimeout(() => this.toast.set(false), 4000);
  }

  /** Hides the toast. */
  closeToast(): void {
    this.toast.set(false);
  }
}