import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-switcher">
      <button
        type="button"
        class="lang-btn"
        [class.active]="currentLang === 'vi'"
        (click)="switchLanguage('vi')"
        aria-label="Switch to Vietnamese"
      >
        VI
      </button>
      <button
        type="button"
        class="lang-btn"
        [class.active]="currentLang === 'en'"
        (click)="switchLanguage('en')"
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  `,
  styles: [`
    .language-switcher {
      display: flex;
      gap: 0.15rem;
      align-items: center;
      padding: 0.18rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(21, 50, 67, 0.18);
    }

    .lang-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 42px;
      height: 28px;
      padding: 0 0.5rem;
      border: none;
      background: transparent;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--deep-space-blue);
      opacity: 0.7;
    }

    .lang-btn:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.85);
    }

    .lang-btn.active {
      opacity: 1;
      color: #fff;
      background: var(--deep-space-blue);
    }

    @media (max-width: 768px) {
      .lang-btn {
        min-width: 40px;
        height: 27px;
        font-size: 0.68rem;
      }
    }
  `]
})
export class LanguageSwitcherComponent {
  private translationService = inject(TranslationService);

  get currentLang(): string {
    return this.translationService.getCurrentLanguage();
  }

  switchLanguage(lang: string): void {
    this.translationService.setLanguage(lang);
  }
}
