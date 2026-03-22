import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translateService = inject(TranslateService);
  private readonly STORAGE_KEY = 'app.lang';
  private readonly SUPPORTED_LANGS = ['vi', 'en'];
  private readonly DEFAULT_LANG = 'vi';
  private currentLangSignal = signal<string>(this.DEFAULT_LANG);

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    // Add supported languages
    this.translateService.addLangs(this.SUPPORTED_LANGS);
    
    // Set default language
    this.translateService.setDefaultLang(this.DEFAULT_LANG);

    // Detect and set initial language
    const lang = this.detectLanguage();
    this.setLanguage(lang);
  }

  private detectLanguage(): string {
    // Check local storage
    const savedLang = localStorage.getItem(this.STORAGE_KEY);
    if (this.SUPPORTED_LANGS.includes(savedLang || '')) {
      return savedLang!;
    }

    // Check browser language
    const browserLang = navigator.language?.slice(0, 2);
    if (this.SUPPORTED_LANGS.includes(browserLang)) {
      return browserLang;
    }

    return this.DEFAULT_LANG;
  }

  setLanguage(lang: string): void {
    if (!this.SUPPORTED_LANGS.includes(lang)) {
      lang = this.DEFAULT_LANG;
    }

    this.translateService.use(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    this.currentLangSignal.set(lang);
  }

  getCurrentLanguage(): string {
    return this.currentLangSignal() || this.translateService.currentLang || this.DEFAULT_LANG;
  }

  toggleLanguage(): void {
    const nextLang = this.getCurrentLanguage() === 'vi' ? 'en' : 'vi';
    this.setLanguage(nextLang);
  }

  getSupportedLanguages(): string[] {
    return this.SUPPORTED_LANGS;
  }

  translate(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }
}
