import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ChatbotWidgetComponent } from './shared/components/chatbot-widget.component';
import { ClickSparkComponent } from './shared/components/click-spark.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TranslationService } from '@core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ChatbotWidgetComponent, ClickSparkComponent, CommonModule],
  template: `
    @if (!isAdminRoute) {
      <app-header></app-header>
    }
    <router-outlet></router-outlet>
    @if (!isAdminRoute) {
      <app-footer></app-footer>
      <app-chatbot-widget></app-chatbot-widget>
      <app-click-spark></app-click-spark>
    }
  `,
  styles: []
})
export class AppComponent {
  title = 'Furni';
  isAdminRoute = false;
  private translationService = inject(TranslationService); // Initialize translation service

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isAdminRoute = event.url.startsWith('/admin');
      });
  }
}
