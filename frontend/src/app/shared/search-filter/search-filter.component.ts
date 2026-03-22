import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export type FilterType = 'select' | 'checkbox' | 'range' | 'date';

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface FilterState {
  searchTerm: string;
  filters: Record<string, any>;
}

export interface SearchFilterConfig {
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  searchVariant?: 'default' | 'glow';
  filterConfigs: FilterConfig[];
}

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="search-filter-wrapper" [class.search-filter-wrapper-glow]="isGlowSearch()">
      <div class="search-bar" *ngIf="config().showSearch !== false" [class.search-bar-glow]="isGlowSearch()">
        <div class="search-input-wrapper" *ngIf="!isGlowSearch()">
          <img src="assets/icons/magnifying_glass.png" alt="Search" class="search-icon">
          <input
            type="text"
            class="search-input"
            [placeholder]="(config().searchPlaceholder || 'search.defaultPlaceholder') | translate"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange()"
          >
          <button
            *ngIf="searchTerm"
            class="clear-search-btn"
            (click)="clearSearch()"
            type="button"
            aria-label="Clear search"
          >
            x
          </button>
        </div>

        <div class="search-glow-shell" *ngIf="isGlowSearch()">
          <div class="search-grid-bg" aria-hidden="true"></div>

          <div class="search-poda" role="search">
            <div class="glow" aria-hidden="true"></div>
            <div class="darkBorderBg" aria-hidden="true"></div>
            <div class="darkBorderBg" aria-hidden="true"></div>
            <div class="darkBorderBg" aria-hidden="true"></div>
            <div class="white" aria-hidden="true"></div>
            <div class="border" aria-hidden="true"></div>

            <div class="search-main">
              <label for="shop-search-input" class="visually-hidden">{{ 'search.label' | translate }}</label>
              <input
                id="shop-search-input"
                [placeholder]="(config().searchPlaceholder || 'search.defaultPlaceholder') | translate"
                type="text"
                name="text"
                class="search-input search-input-glow"
                [ngModel]="searchTerm"
                (ngModelChange)="onSearchTermInput($event)"
                aria-label="Search"
                autocomplete="off"
              >
              <div class="input-mask" aria-hidden="true"></div>
              <div class="pink-mask" aria-hidden="true"></div>

              <div class="filter-border" aria-hidden="true"></div>


              <div class="search-icon-glow" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  viewBox="0 0 24 24"
                  height="24"
                  fill="currentColor"
                  color="currentColor"
                  aria-hidden="true"
                >
                  <path d="m21.78 20.72-5.62-5.62A7.96 7.96 0 0 0 18 10c0-4.41-3.59-8-8-8s-8 3.59-8 8 3.59 8 8 8a7.96 7.96 0 0 0 5.1-1.84l5.62 5.62 1.06-1.06ZM10 16.5A6.506 6.506 0 0 1 3.5 10c0-3.585 2.915-6.5 6.5-6.5s6.5 2.915 6.5 6.5-2.915 6.5-6.5 6.5Z" fill="currentColor"></path>
                </svg>
              </div>

              <button
                *ngIf="searchTerm"
                class="clear-search-btn clear-search-btn-glow"
                (click)="clearSearch()"
                type="button"
                aria-label="Clear search"
              >
                x
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="filters-section" *ngIf="shouldShowFiltersSection()">
        <div class="filters-header">
          <img src="assets/icons/filter.png" alt="Filter" class="filter-icon">
          <h3 class="filters-title">{{ 'filter.title' | translate }}</h3>
          <button
            *ngIf="hasActiveFilters()"
            class="clear-filters-btn"
            (click)="clearAllFilters()"
            type="button"
          >
            {{ 'filter.clearAll' | translate }}
          </button>
        </div>

        <div class="filters-grid">
          <div
            class="filter-group"
            *ngFor="let filterConfig of config().filterConfigs"
          >
            <label class="filter-label">{{ filterConfig.label | translate }}</label>

            <select
              *ngIf="filterConfig.type === 'select'"
              class="filter-select"
              [(ngModel)]="filters()[filterConfig.key]"
              (ngModelChange)="onFilterChange()"
            >
              <option [value]="''">{{ 'filter.all' | translate }}</option>
              <option
                *ngFor="let option of filterConfig.options"
                [value]="option.value"
              >
                {{ option.label | translate }}
              </option>
            </select>

            <div *ngIf="filterConfig.type === 'checkbox'" class="filter-checkbox-wrapper">
              <input
                type="checkbox"
                [id]="'filter-' + filterConfig.key"
                class="filter-checkbox"
                [(ngModel)]="filters()[filterConfig.key]"
                (ngModelChange)="onFilterChange()"
              >
              <label [for]="'filter-' + filterConfig.key" class="checkbox-label">
                {{ (filterConfig.placeholder || 'filter.enable') | translate }}
              </label>
            </div>

            <div *ngIf="filterConfig.type === 'range'" class="filter-range-wrapper">
              <div class="range-inputs">
                <input
                  type="number"
                  class="range-input"
                  [placeholder]="('filter.min' | translate) + ': ' + (filterConfig.min || 0)"
                  [(ngModel)]="filters()[filterConfig.key + '_min']"
                  (ngModelChange)="onFilterChange()"
                  [min]="filterConfig.min ?? null"
                  [max]="filterConfig.max ?? null"
                >
                <span class="range-separator">-</span>
                <input
                  type="number"
                  class="range-input"
                  [placeholder]="('filter.max' | translate) + ': ' + (filterConfig.max || 0)"
                  [(ngModel)]="filters()[filterConfig.key + '_max']"
                  (ngModelChange)="onFilterChange()"
                  [min]="filterConfig.min ?? null"
                  [max]="filterConfig.max ?? null"
                >
              </div>
            </div>

            <input
              *ngIf="filterConfig.type === 'date'"
              type="date"
              class="filter-date"
              [(ngModel)]="filters()[filterConfig.key]"
              (ngModelChange)="onFilterChange()"
            >
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-filter-wrapper {
      margin-bottom: 2rem;
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .search-filter-wrapper-glow {
      padding: 0;
      background: transparent;
      box-shadow: none;
    }


    .search-input-wrapper {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-70%);
      width: 24px;
      height: 24px;
      opacity: 0.5;
      pointer-events: none;
      display: block;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 3rem 0.625rem 3.25rem;
      height: 42px;
      border: 1px solid #ddd;
      border-radius: 6px;
      color: #000;
      font-size: 0.95rem;
      line-height: 1.5;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #153243;
      box-shadow: 0 0 0 3px rgba(21, 50, 67, 0.1);
    }

    .clear-search-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1rem;
      text-transform: uppercase;
      color: #999;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      line-height: 1;
      transition: color 0.2s;
    }

    .clear-search-btn:hover {
      color: #333;
    }

    .visually-hidden {
      position: absolute !important;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .search-glow-shell {
      --input-w: min(100%, 500px);
      --input-h: 56px;
      --radius: 10px;
      --frame-w: calc(var(--input-w) + 6px);
      --frame-h: calc(var(--input-h) + 6px);
      --frame2-w: calc(var(--input-w) + 10px);
      --frame2-h: calc(var(--input-h) + 10px);
      --white-w: calc(var(--input-w) + 6px);
      --white-h: calc(var(--input-h) + 7px);
      --border-w: calc(var(--input-w) + 1px);
      --border-h: calc(var(--input-h) + 0px);
      --dark-frame-w: calc(var(--input-w) + 1px);
      --dark-frame-h: calc(var(--input-h) + 1px);
      --glow-w: calc(var(--input-w) + 1px);
      --glow-h: calc(var(--input-h) + 1px);
      --bg: #f3f1eb;
      position: relative;
      width: 100%;
      padding: 1.25rem 1rem 0;
      border-radius: 20px;
    }

    .search-grid-bg {
      position: absolute;
      inset: 0;
      border-radius: 20px;
      background-size: 1rem 1rem;
      background-position: center center;
      filter: blur(1px);
      opacity: 0.95;
      z-index: 0;
    }

    .search-poda {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 90px;
      width: 100%;
    }

    .search-main {
      position: relative;
      width: var(--input-w);
      height: var(--input-h);
      max-width: 100%;
    }

    .search-input-glow {
      background-color: #ececec;
      border: none;
      width: var(--input-w);
      height: var(--input-h);
      border-radius: var(--radius);
      color: #000000;
      padding-inline: 59px 84px;
      font-size: 18px;
      position: relative;
      z-index: 3;
      box-shadow: none;
    }

    .search-input-glow::placeholder {
      color: #8a8888;
      opacity: 1;
    }

    .search-input-glow:focus {
      outline: 2px solid #2b2752;
      outline-offset: 0;
      border: none;
      box-shadow: none;
    }

    .input-mask {
      pointer-events: none;
      width: 100px;
      height: 20px;
      position: absolute;
      top: 18px;
      left: 70px;
      z-index: 4;
    }

    .search-main:focus-within > .input-mask {
      display: none;
    }

    .pink-mask {
      pointer-events: none;
      width: 30px;
      height: 20px;
      position: absolute;
      background: #cf30aa;
      top: 10px;
      left: 5px;
      filter: blur(20px);
      opacity: 0.8;
      transition: opacity 0.4s ease;
      z-index: 2;
    }

    .search-main:hover > .pink-mask {
      opacity: 0;
    }

    .search-icon-glow {
      position: absolute;
      left: 20px;
      top: 15px;
      z-index: 4;
      color: #000;
      pointer-events: none;
    }



    .white,
    .border,
    .darkBorderBg,
    .glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      overflow: hidden;
      border-radius: 12px;
      pointer-events: none;
      z-index: 1;
    }

    .white,
    .border,
    .darkBorderBg {
      width: var(--frame-w);
      height: var(--frame-h);
      filter: blur(3px);
    }

    .white {
      width: var(--white-w);
      height: var(--white-h);
      filter: blur(2px);
    }

    .white::before {
      content: '';
      position: absolute;
      inset: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(83deg);
      width: 600px;
      height: 600px;
      background-repeat: no-repeat;
      background-position: 0 0;
      filter: brightness(1.4);
      background-image: conic-gradient(
        rgba(0, 0, 0, 0) 0%,
        #a099d8,
        rgba(0, 0, 0, 0) 8%,
        rgba(0, 0, 0, 0) 50%,
        #dfa2da,
        rgba(0, 0, 0, 0) 58%
      );
      transition: transform 2s ease;
    }

    .border {
      width: var(--border-w);
      height: var(--border-h);
      filter: blur(0.5px);
    }

    .border::before {
      content: '';
      position: absolute;
      inset: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(70deg);
      width: 600px;
      height: 600px;
      filter: brightness(1.3);
      background-repeat: no-repeat;
      background-position: 0 0;
      background-image: conic-gradient(
        #1c191c,
        #402fb5 5%,
        #1c191c 14%,
        #1c191c 50%,
        #cf30aa 60%,
        #1c191c 64%
      );
      transition: transform 2s ease;
    }

    .darkBorderBg {
      width: var(--dark-frame-w);
      height: var(--dark-frame-h);
    }

    .darkBorderBg::before {
      content: '';
      position: absolute;
      inset: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(82deg);
      width: 600px;
      height: 600px;
      background-repeat: no-repeat;
      background-position: 0 0;
      background-image: conic-gradient(
        rgba(0, 0, 0, 0),
        #18116a,
        rgba(0, 0, 0, 0) 10%,
        rgba(0, 0, 0, 0) 50%,
        #6e1b60,
        rgba(0, 0, 0, 0) 60%
      );
      transition: transform 2s ease;
    }

    .glow {
      width: var(--glow-w);
      height: var(--glow-h);
      filter: blur(30px);
      opacity: 0.4;
    }

    .glow::before {
      content: '';
      position: absolute;
      inset: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(60deg);
      width: 999px;
      height: 999px;
      background-repeat: no-repeat;
      background-position: 0 0;
      background-image: conic-gradient(
        #000,
        #402fb5 5%,
        #000 38%,
        #000 50%,
        #cf30aa 60%,
        #000 87%
      );
      transition: transform 2s ease;
    }

    .search-poda:hover > .darkBorderBg::before {
      transform: translate(-50%, -50%) rotate(262deg);
    }

    .search-poda:hover > .glow::before {
      transform: translate(-50%, -50%) rotate(240deg);
    }

    .search-poda:hover > .white::before {
      transform: translate(-50%, -50%) rotate(263deg);
    }

    .search-poda:hover > .border::before {
      transform: translate(-50%, -50%) rotate(250deg);
    }

    .search-poda:focus-within > .darkBorderBg::before {
      transform: translate(-50%, -50%) rotate(442deg);
      transition: transform 4s ease;
    }

    .search-poda:focus-within > .glow::before {
      transform: translate(-50%, -50%) rotate(420deg);
      transition: transform 4s ease;
    }

    .search-poda:focus-within > .white::before {
      transform: translate(-50%, -50%) rotate(443deg);
      transition: transform 4s ease;
    }

    .search-poda:focus-within > .border::before {
      transform: translate(-50%, -50%) rotate(430deg);
      transition: transform 4s ease;
    }

    .clear-search-btn-glow {
      right: 56px;
      color: #c0b9c0;
      z-index: 5;
      padding: 0.3rem;
      font-size: 0.85rem;
    }

    .clear-search-btn-glow:hover {
      color: #fff;
    }

    .filters-section {
      border-top: 1px solid #eee;
      padding-top: 1.5rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      padding-inline: 1.5rem;
      padding-bottom: 1.5rem;
    }

    .search-filter-wrapper-glow .filters-section {
      border-top: none;
    }

    .filters-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .filter-icon {
      width: 24px;
      height: 24px;
      opacity: 0.7;
      flex-shrink: 0;
    }

    .filters-title {
      font-size: 1rem;
      font-weight: 600;
      color: #153243;
      margin: 0;
      flex: 1;
    }

    .clear-filters-btn {
      background: none;
      border: 1px solid #ddd;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
    }

    .clear-filters-btn:hover {
      border-color: #153243;
      color: #153243;
      background: #f8f9fa;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.7rem;
      align-items: start;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #555;
      margin: 0 0 0.25rem 0;
      display: block;
    }

    .filter-select,
    .filter-date,
    .range-input {
      width: 100%;
      height: 42px;
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
      line-height: 1.5;
      transition: all 0.2s;
      background: #fff;
    }

    .filter-select:focus,
    .filter-date:focus,
    .range-input:focus {
      outline: none;
      border-color: #153243;
      box-shadow: 0 0 0 2px rgba(21, 50, 67, 0.1);
    }

    .filter-checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 42px;
    }

    .filter-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
      flex-shrink: 0;
      margin: 0;
      vertical-align: middle;
    }

    .checkbox-label {
      font-size: 0.9rem;
      color: #666;
      cursor: pointer;
      margin: 0;
      user-select: none;
    }

    .range-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .range-input {
      flex: 1;
      min-width: 0;
    }

    .range-separator {
      color: #999;
      font-weight: 500;
      flex-shrink: 0;
    }

    @keyframes rotate {
      100% {
        transform: translate(-50%, -50%) rotate(450deg);
      }
    }

    @media (max-width: 768px) {
      .search-glow-shell {
        padding: 1rem 0.75rem 0;
      }

      .search-glow-shell {
        --input-w: 100%;
      }

      .search-main {
        width: 100%;
      }

      .search-input-glow {
        font-size: 16px;
        padding-inline: 56px 84px;
      }

      .white,
      .border,
      .darkBorderBg,
      .glow {
        max-width: none;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .filters-section {
        padding-inline: 1rem;
      }
    }
  `]
})
export class SearchFilterComponent {
  @Input() config = signal<SearchFilterConfig>({
    filterConfigs: []
  });

  @Output() filterChange = new EventEmitter<FilterState>();

  searchTerm = '';
  filters = signal<Record<string, any>>({});
  filtersExpanded = signal<boolean>(true);

  isGlowSearch(): boolean {
    return this.config().searchVariant === 'glow';
  }

  onSearchChange(): void {
    this.emitFilterState();
  }

  onSearchTermInput(value: string): void {
    this.searchTerm = value;
    this.emitFilterState();
  }

  onFilterChange(): void {
    this.emitFilterState();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.emitFilterState();
  }

  clearAllFilters(): void {
    this.filters.set({});
    this.emitFilterState();
  }

  toggleFiltersPanel(): void {
    if (this.config().showFilters === false || this.config().filterConfigs.length === 0) {
      return;
    }

    this.filtersExpanded.update(value => !value);
  }

  shouldShowFiltersSection(): boolean {
    return this.config().showFilters !== false
      && this.config().filterConfigs.length > 0
      && (!this.isGlowSearch() || this.filtersExpanded());
  }

  hasActiveFilters(): boolean {
    const filterValues = Object.values(this.filters());
    return filterValues.some(value => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value !== '';
      if (typeof value === 'number') return true;
      return false;
    });
  }

  private emitFilterState(): void {
    this.filterChange.emit({
      searchTerm: this.searchTerm,
      filters: this.filters()
    });
  }
}
