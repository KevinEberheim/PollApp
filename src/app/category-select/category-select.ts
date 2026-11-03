import { Component, computed, input, model, signal } from '@angular/core';
import { CATEGORIES } from '../constants/categories';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.html',
  styleUrl: './category-select.scss',
})
export class CategorySelect {
  label = input('Sort by categories');
  allOption = input(false);
  invalid = input(false);
  value = model('');
  open = signal(false);
  categories = CATEGORIES;
  chosen = computed(() => this.value() !== '' && this.value() !== 'All');

  /** Opens or closes the dropdown. */
  toggleMenu(): void {
    this.open.update((value) => !value);
  }

  /**
   * Selects a category and closes the dropdown.
   * @param category The category name or "All".
   */
  select(category: string): void {
    this.value.set(category);
    this.open.set(false);
  }
}