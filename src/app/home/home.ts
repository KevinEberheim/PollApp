import { Component, ElementRef, OnDestroy, OnInit, computed, effect, signal, viewChild } from '@angular/core';
import { Supabase } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
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
export class Home implements OnInit, OnDestroy {
  surveys = signal<Survey[]>([]);
  tab = signal<'active' | 'past'>('active');
  category = signal('All');
  active = computed(() => this.surveys().filter(isActive));
  past = computed(() => this.surveys().filter((s) => !isActive(s)));
  endingSoon = computed(() => this.active().filter((s) => s.end_date).slice(0, 3));
  visible = computed(() =>
    this.filterByCategory(this.tab() === 'active' ? this.active() : this.past())
  );
  list = viewChild<ElementRef<HTMLElement>>('list');
  thumbTop = signal(0);
  scrollable = signal(false);
  maxHeight = signal<number | null>(null);
  thumbHeight = 64;

  private channel?: RealtimeChannel;

  constructor(private db: Supabase) {
    effect(() => {
      this.visible();
      setTimeout(() => this.onScroll());
    });
  }

  /** Loads all surveys and reloads them on every change in the database. */
  async ngOnInit(): Promise<void> {
    await this.reload();
    this.channel = this.db.subscribeToSurveys(() => this.reload());
  }

  /** Stops the realtime subscription. */
  ngOnDestroy(): void {
    if (this.channel) this.db.unsubscribe(this.channel);
  }

  /** Loads all surveys from the database. */
  async reload(): Promise<void> {
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

  /** Updates the custom scrollbar position and visibility. */
  onScroll(): void {
    const el = this.list()?.nativeElement;
    if (!el) return;
    this.updateHeight(el);
    const max = el.scrollHeight - el.clientHeight;
    this.scrollable.set(max > 2 && el.children.length > 6);
    const ratio = max > 0 ? el.scrollTop / max : 0;
    this.thumbTop.set(ratio * (el.clientHeight - this.thumbHeight));
  }

  /**
   * Limits the list to the height of its first three rows.
   * @param el The list element.
   */
  updateHeight(el: HTMLElement): void {
    const items = Array.from(el.children) as HTMLElement[];
    const last = items[Math.min(5, items.length - 1)];
    if (!last) return this.maxHeight.set(null);
    this.maxHeight.set(last.offsetTop + last.offsetHeight - items[0].offsetTop);
  }
}