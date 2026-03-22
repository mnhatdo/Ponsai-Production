import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '@environments/environment';
import { SearchFilterComponent, SearchFilterConfig, FilterState } from '@shared/search-filter/search-filter.component';

interface BlogPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  author: string;
  excerpt: string;
  content: string;
  image: string;
  categories: string[];
}

interface BlogResponse {
  success: boolean;
  count: number;
  data: BlogPost[];
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchFilterComponent, TranslateModule],
  template: `
    <!-- Hero Section -->
    <div class="hero">
      <div class="container">
        <div class="row justify-content-between">
          <div class="col-lg-5">
            <div class="intro-excerpt">
              <h1>{{ 'blog.heroTitle' | translate }}</h1>
              <p class="mb-4">{{ 'blog.heroDescription' | translate }}</p>
              <p class="hero-cta-group"><a routerLink="/shop" class="hero-cta-btn hero-cta-btn-primary">{{ 'blog.browseCollection' | translate }}</a><a routerLink="/about" class="hero-cta-btn hero-cta-btn-secondary">{{ 'blog.aboutUs' | translate }} <span aria-hidden="true">→</span></a></p>
            </div>
          </div>
          <div class="col-lg-7">
            <div class="hero-img-wrap">
              <img src="assets/images/couch.png" class="img-fluid" alt="Bonsai Collection">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Blog Section -->
    <div class="blog-section">
      <div class="container">
        <!-- Search & Filter -->
        <app-search-filter
          [config]="filterConfig"
          (filterChange)="onFilterChange($event)"
        ></app-search-filter>

        <!-- Results Info -->
        @if (!loading() && !error()) {
          <div class="results-info mb-3">
            <p class="text-muted">
              {{ 'blog.resultsShowing' | translate }} {{ filteredPosts().length }} {{ 'blog.resultsOf' | translate }} {{ posts().length }} {{ 'blog.posts' | translate }}
              @if (currentFilters().searchTerm) {
                <span> {{ 'blog.resultsFor' | translate }} "{{ currentFilters().searchTerm }}"</span>
              }
            </p>
          </div>
        }

        <!-- Loading State -->
        @if (loading()) {
          <div class="text-center py-5">
            <div class="spinner-border text-success" role="status">
              <span class="visually-hidden">{{ 'button.loading' | translate }}</span>
            </div>
            <p class="mt-3 text-muted">{{ 'blog.loadingPosts' | translate }}</p>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <div class="text-center py-5">
            <p class="text-danger">{{ error() }}</p>
            <button class="btn btn-primary" (click)="loadPosts()">{{ 'blog.tryAgain' | translate }}</button>
          </div>
        }

        <!-- Blog Posts Grid -->
        @if (!loading() && !error()) {
          <div class="row">
            @for (post of displayedPosts(); track post.id) {
              <div class="col-12 col-sm-6 col-md-4 mb-5">
                <div class="post-entry">
                  <a [href]="post.link" target="_blank" rel="noopener" class="post-thumbnail">
                    <img 
                      [src]="post.image" 
                      [alt]="post.title" 
                      class="img-fluid"
                      (error)="onImageError($event)"
                    >
                  </a>
                  <div class="post-content-entry">
                    <h3><a [href]="post.link" target="_blank" rel="noopener">{{ post.title }}</a></h3>
                    <div class="meta">
                      <span>{{ 'blog.by' | translate }} <a [href]="post.link" target="_blank" rel="noopener">{{ post.author }}</a></span> 
                      <span>{{ 'blog.on' | translate }} <a [href]="post.link" target="_blank" rel="noopener">{{ formatDate(post.pubDate) }}</a></span>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (filteredPosts().length === 0) {
              <div class="col-12 text-center py-5">
                <h4>{{ 'blog.noPostsFound' | translate }}</h4>
                <p class="text-muted">{{ 'blog.adjustFilters' | translate }}</p>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="d-flex justify-content-center mt-4">
              <nav aria-label="Blog pagination">
                <ul class="pagination">
                  <li class="page-item" [class.disabled]="currentPage() === 1">
                    <button class="page-link" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">
                      {{ 'blog.previous' | translate }}
                    </button>
                  </li>
                  @for (page of pageNumbers(); track page) {
                    <li class="page-item" [class.active]="page === currentPage()">
                      <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
                    </li>
                  }
                  <li class="page-item" [class.disabled]="currentPage() === totalPages()">
                    <button class="page-link" (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()">
                      {{ 'blog.next' | translate }}
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .hero {
      position: relative;
      background-image: url('/assets/images/banner4.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(21, 50, 67, 0.74) 0%, rgba(21, 50, 67, 0.5) 38%, rgba(21, 50, 67, 0.2) 70%, rgba(21, 50, 67, 0.06) 100%);
      z-index: 1;
    }

    .hero .container {
      position: relative;
      z-index: 2;
    }

    .hero .intro-excerpt {
      max-width: 560px;
    }

    .hero .hero-img-wrap {
      display: none;
    }

    .hero-cta-group {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0;
    }

    .hero-cta-btn {
      position: relative;
      min-width: 164px;
      height: 48px;
      padding: 0 1.6rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #24272d;
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      letter-spacing: 0.01em;
      z-index: 0;
    }

    .hero-cta-btn::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      background: linear-gradient(-45deg, #e81cff 0%, #40c9ff 100%);
      z-index: -2;
      transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .hero-cta-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: #24272d;
      z-index: -1;
      box-shadow: 0 18px 28px rgba(10, 16, 30, 0.22);
    }

    .hero-cta-btn:hover {
      color: #fff;
    }

    .hero-cta-btn:hover::before {
      transform: rotate(-180deg);
    }

    .hero-cta-btn:active::before {
      transform: scale(0.92);
    }

    .hero-cta-btn-secondary {
      min-width: auto;
      background: transparent;
      color: #ffc107;
      padding: 0;
      height: auto;
      border-radius: 0;
      gap: 0.5rem;
      font-weight: 700;
    }

    .hero-cta-btn-secondary::before,
    .hero-cta-btn-secondary::after {
      display: none;
    }

    .hero-cta-btn-secondary:hover {
      color: #ffd24a;
    }

    .blog-section {
      padding: 80px 0;
    }

    .post-entry .post-thumbnail {
      display: block;
      margin-bottom: 20px;
      overflow: hidden;
      border-radius: 8px;
    }

    .post-entry .post-thumbnail img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      transition: all 0.3s ease;
    }

    .post-entry:hover .post-thumbnail img {
      transform: scale(1.05);
      opacity: 0.9;
    }

    .post-content-entry h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .post-content-entry h3 a {
      color: #2f2f2f;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .post-content-entry h3 a:hover {
      color: #153243;
    }

    .meta {
      font-size: 14px;
      color: #6c757d;
    }

    .meta a {
      color: #153243;
      text-decoration: none;
    }

    .meta a:hover {
      text-decoration: underline;
    }

    .meta span {
      margin-right: 10px;
    }

    .pagination {
      gap: 5px;
    }

    .page-link {
      color: #153243;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }

    .page-item.active .page-link {
      background-color: #153243;
      border-color: #153243;
    }

    .page-link:hover {
      color: #0d1f29;
      background-color: #e9ecef;
    }

    .page-link:focus {
      box-shadow: 0 0 0 0.25rem rgba(59, 93, 80, 0.25);
    }
  `]
})
export class BlogComponent implements OnInit {
  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  private apiUrl = `${environment.apiUrl}/blog`;

  // State signals
  posts = signal<BlogPost[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  currentFilters = signal<FilterState>({ searchTerm: '', filters: {} });

  // Configuration
  readonly postsPerPage = 12;
  readonly maxPosts = 24;

  // Filter configuration
  filterConfig = signal<SearchFilterConfig>({
    searchPlaceholder: 'blog.searchPlaceholder',
    showSearch: true,
    showFilters: true,
    searchVariant: 'glow',
    filterConfigs: [
      {
        key: 'author',
        label: 'blog.filter.author',
        type: 'select',
        options: [] // Will be populated from posts
      },
      {
        key: 'sortBy',
        label: 'blog.filter.sortBy',
        type: 'select',
        options: [
          { value: 'date-desc', label: 'blog.sort.newestFirst' },
          { value: 'date-asc', label: 'blog.sort.oldestFirst' },
          { value: 'title-asc', label: 'blog.sort.titleAsc' },
          { value: 'title-desc', label: 'blog.sort.titleDesc' }
        ]
      },
      {
        key: 'publishedAfter',
        label: 'blog.filter.publishedAfter',
        type: 'date'
      }
    ]
  });

  // Filtered and sorted posts
  filteredPosts = computed(() => {
    let filtered = this.posts().slice(0, this.maxPosts);
    const { searchTerm, filters } = this.currentFilters();

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        post.author.toLowerCase().includes(term)
      );
    }

    // Author filter
    if (filters['author']) {
      filtered = filtered.filter(post => post.author === filters['author']);
    }

    // Date filter
    if (filters['publishedAfter']) {
      const filterDate = new Date(filters['publishedAfter']);
      filtered = filtered.filter(post => new Date(post.pubDate) >= filterDate);
    }

    // Sort
    const sortBy = filters['sortBy'] || 'date-desc';
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        case 'date-asc':
          return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  });

  // Computed values
  totalPosts = computed(() => this.filteredPosts().length);
  totalPages = computed(() => Math.ceil(this.totalPosts() / this.postsPerPage));
  startIndex = computed(() => (this.currentPage() - 1) * this.postsPerPage);
  endIndex = computed(() => Math.min(this.startIndex() + this.postsPerPage, this.totalPosts()));
  
  displayedPosts = computed(() => {
    const start = this.startIndex();
    const end = this.endIndex();
    return this.filteredPosts().slice(start, end);
  });

  // Legacy computed for backward compatibility
  currentPagePosts = computed(() => this.displayedPosts());

  pageNumbers = computed(() => {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<BlogResponse>(this.apiUrl).subscribe({
      next: (response) => {
        if (response.success) {
          this.posts.set(response.data.slice(0, this.maxPosts));
          this.populateAuthorFilter();
        } else {
          this.error.set(this.translate.instant('blog.failedToLoad'));
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading blog posts:', err);
        this.error.set(this.translate.instant('blog.unableToConnect'));
        this.loading.set(false);
      }
    });
  }

  populateAuthorFilter(): void {
    const authors = new Set<string>();
    this.posts().forEach(post => {
      if (post.author) {
        authors.add(post.author);
      }
    });

    const authorOptions = Array.from(authors).map(author => ({
      value: author,
      label: author
    }));

    const config = this.filterConfig();
    const authorFilterIndex = config.filterConfigs.findIndex(f => f.key === 'author');
    if (authorFilterIndex !== -1) {
      config.filterConfigs[authorFilterIndex].options = authorOptions;
      this.filterConfig.set({ ...config });
    }
  }

  onFilterChange(filterState: FilterState): void {
    this.currentFilters.set(filterState);
    this.currentPage.set(1); // Reset to first page when filters change
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const locale = this.translate.currentLang === 'vi' ? 'vi-VN' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/post-1.jpg';
  }
}
