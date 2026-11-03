import { Component, OnInit, computed, signal } from '@angular/core';
import { Supabase } from '../supabase';
import { Survey } from '../interfaces/survey.interface';
import { isActive } from '../utils/survey.utils';
import { SurveyCard } from '../survey-card/survey-card';
import { SurveyItem } from '../survey-item/survey-item';
import { RouterLink } from '@angular/router';
import { CategorySelect } from '../category-select/category-select';


@Component({
  selector: 'app-home',
  imports: [SurveyCard, SurveyItem, RouterLink, CategorySelect],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  surveys = signal<Survey[]>([]);
  tab = signal<'active' | 'past'>('active');
  category = signal('All');
  active = computed(() => this.surveys().filter(isActive));
  past = computed(() => this.surveys().filter((s) => !isActive(s)));
  endingSoon = computed(() => this.active().filter((s) => s.end_date).slice(0, 3));
  visible = computed(() =>
    this.filterByCategory(this.tab() === 'active' ? this.active() : this.past())
  );

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

  /**
 * Switches the tab and resets the category filter.
 * @param tab The tab to show.
 */
  setTab(tab: 'active' | 'past'): void {
    this.tab.set(tab);
    this.category.set('All');
  }
}