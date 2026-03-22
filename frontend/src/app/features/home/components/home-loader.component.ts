import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-home-loader" aria-hidden="true" (click)="skipLoader()">
      <div class="skip-hint">Nhấn vào bất kỳ đâu để bỏ qua</div>
      <iframe
        class="demo-home-loader__animation"
        [class.demo-home-loader__animation--hidden]="hideFlowers"
        src="assets/demo-import/interactive-flowers/index.html"
        title="Page loading animation"
        tabindex="-1"
      ></iframe>
      <div
        class="demo-home-loader__brand"
        [class.demo-home-loader__brand--visible]="showBrand"
      >
        <img
          src="assets/demo-import/loader/logo-red.png"
          alt="Ponsai"
          class="demo-home-loader__brand-img"
          [class.demo-home-loader__brand-img--visible]="showBrand"
        />
      </div>
    </div>
  `,
  styles: [`
    .demo-home-loader {
      position: fixed;
      inset: 0;
      z-index: 5000;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      pointer-events: all;
      cursor: pointer;
    }

    .skip-hint {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      z-index: 10;
      pointer-events: none;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.4; }
      50% { opacity: 0.8; }
      100% { opacity: 0.4; }
    }

    .demo-home-loader__animation {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      pointer-events: none;
      opacity: 0.78;
      filter: saturate(0.95) brightness(0.75);
      visibility: visible;
      transition: opacity 380ms ease, visibility 0s linear 380ms;
    }

    .demo-home-loader__animation--hidden {
      opacity: 0;
      visibility: hidden;
    }

    .demo-home-loader__brand {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.58);
      padding: 0 20px;
    }

    .demo-home-loader__brand--visible {
      opacity: 1;
      animation: demo-home-loader-zoom-in 980ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }

    .demo-home-loader__brand-img {
      transform: scale(1);
      opacity: 0;
    }

    .demo-home-loader__brand-img--visible {
      opacity: 1;
    }

    .demo-home-loader__brand img {
      width: min(72vw, 460px);
      max-width: 100%;
      height: auto;
      filter: drop-shadow(0 0 18px rgba(255, 34, 34, 0.35));
      user-select: none;
      -webkit-user-drag: none;
    }

    @keyframes demo-home-loader-zoom-in {
      0% {
        opacity: 0;
        transform: scale(0.58);
      }
      70% {
        opacity: 1;
        transform: scale(1.08);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class HomeLoaderComponent implements OnInit, OnDestroy {
  @Output() done = new EventEmitter<void>();

  showBrand = false;
  hideFlowers = false;

  private fallbackTimer: number | null = null;
  private revealTimer: number | null = null;
  private doneTimer: number | null = null;
  private sequenceStarted = false;
  private isSkipped = false;

  private readonly onFrameMessage = (event: MessageEvent): void => {
    if (this.isSkipped) return;
    const messageType = typeof event.data === 'string' ? event.data : event.data?.type;
    if (messageType === 'interactive-flowers-finished') {
      this.revealBrand();
    }
  };

  skipLoader(): void {
    if (this.isSkipped) return;
    this.isSkipped = true;
    this.cleanupTimers();
    this.done.emit();
  }

  ngOnInit(): void {
    window.addEventListener('message', this.onFrameMessage);

    this.fallbackTimer = window.setTimeout(() => {
      this.revealBrand();
    }, 6500);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onFrameMessage);
    this.cleanupTimers();
  }

  private cleanupTimers(): void {
    if (this.fallbackTimer !== null) {
      window.clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    if (this.revealTimer !== null) {
      window.clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }

    if (this.doneTimer !== null) {
      window.clearTimeout(this.doneTimer);
      this.doneTimer = null;
    }
  }

  private revealBrand(): void {
    if (this.sequenceStarted || this.isSkipped) {
      return;
    }

    this.sequenceStarted = true;
    this.hideFlowers = true;

    this.revealTimer = window.setTimeout(() => {
      this.showBrand = true;
    }, 380);

    if (this.fallbackTimer !== null) {
      window.clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    this.doneTimer = window.setTimeout(() => {
      this.done.emit();
    }, 2200);
  }
}
