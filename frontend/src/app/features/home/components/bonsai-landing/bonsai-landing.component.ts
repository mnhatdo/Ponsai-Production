import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener, OnDestroy } from '@angular/core';

interface DustParticle {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  alpha: number;
}

@Component({
  selector: 'app-bonsai-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bonsai-landing.component.html',
  styleUrl: './bonsai-landing.component.scss'
})
export class BonsaiLandingComponent implements AfterViewInit, OnDestroy {
  protected readonly bonsaiImages = [
    'assets/bonsai/image-Photoroom1.png',
    'assets/bonsai/image-Photoroom2.png',
    'assets/bonsai/image-Photoroom3.png',
    'assets/bonsai/image-Photoroom4.png',
    'assets/bonsai/image-Photoroom5.png'
  ];

  protected activeIndex = 0;
  protected incomingIndex: number | null = null;
  protected isAnimating = false;
  protected direction: 1 | -1 = 1;
  protected permanentlyUnlocked = false;
  protected dustParticles: DustParticle[] = [];

  private readonly transitionMs = 920;
  private wheelHandler: (event: WheelEvent) => void;
  private touchStartY = 0;
  private touchHandlerStart: (event: TouchEvent) => void;
  private touchHandlerMove: (event: TouchEvent) => void;

  constructor() {
    this.wheelHandler = (event: WheelEvent) => this.onWheel(event);
    this.touchHandlerStart = (event: TouchEvent) => this.onTouchStart(event);
    this.touchHandlerMove = (event: TouchEvent) => this.onTouchMove(event);
  }

  ngAfterViewInit(): void {
    this.updateBodyOverflow();
    window.addEventListener('wheel', this.wheelHandler, { passive: false });
    window.addEventListener('touchstart', this.touchHandlerStart, { passive: true });
    window.addEventListener('touchmove', this.touchHandlerMove, { passive: false });
  }

  ngOnDestroy(): void {
    window.removeEventListener('wheel', this.wheelHandler);
    window.removeEventListener('touchstart', this.touchHandlerStart);
    window.removeEventListener('touchmove', this.touchHandlerMove);
    document.body.style.overflow = '';
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    if (!this.permanentlyUnlocked && window.scrollY > window.innerHeight * 0.16) {
      this.permanentlyUnlocked = true;
      this.updateBodyOverflow();
    }
  }

  protected treeIndexLabel(index: number): string {
    return `Ponsai bonsai ${index + 1}`;
  }

  protected scrollPastHero(): void {
    this.permanentlyUnlocked = true;
    this.updateBodyOverflow();

    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  }

  private onWheel(event: WheelEvent): void {
    if (this.permanentlyUnlocked) {
      return;
    }

    if (!this.isHeroDominantOnScreen()) {
      return;
    }

    if (Math.abs(event.deltaY) < 7) {
      return;
    }

    event.preventDefault();
    this.startTransition(event.deltaY > 0 ? 1 : -1);
  }

  private onTouchStart(event: TouchEvent): void {
    if (!event.touches.length) {
      return;
    }
    this.touchStartY = event.touches[0].clientY;
  }

  private onTouchMove(event: TouchEvent): void {
    if (this.permanentlyUnlocked) {
      return;
    }

    if (!this.isHeroDominantOnScreen()) {
      return;
    }

    if (!event.touches.length) {
      return;
    }

    const currentY = event.touches[0].clientY;
    const deltaY = this.touchStartY - currentY;

    if (Math.abs(deltaY) < 20) {
      return;
    }

    event.preventDefault();
    this.startTransition(deltaY > 0 ? 1 : -1);
    this.touchStartY = currentY;
  }

  private startTransition(stepDirection: 1 | -1): void {
    if (this.isAnimating) {
      return;
    }

    this.direction = stepDirection;
    this.incomingIndex = this.mod(this.activeIndex + stepDirection, this.bonsaiImages.length);
    this.dustParticles = this.generateDustParticles(36);
    this.isAnimating = true;

    window.setTimeout(() => {
      if (this.incomingIndex === null) {
        return;
      }

      this.activeIndex = this.incomingIndex;
      this.incomingIndex = null;
      this.isAnimating = false;
    }, this.transitionMs);
  }

  private generateDustParticles(count: number): DustParticle[] {
    return Array.from({ length: count }, () => ({
      x: Math.round(Math.random() * 80 + 10),
      y: Math.round(Math.random() * 70 + 12),
      size: Math.round(Math.random() * 7 + 5),
      delay: Number((Math.random() * 0.2).toFixed(3)),
      duration: Number((0.52 + Math.random() * 0.46).toFixed(3)),
      drift: Number((Math.random() * 220 + 70).toFixed(1)),
      spin: Math.round(Math.random() * 110 - 55),
      alpha: Number((0.24 + Math.random() * 0.5).toFixed(2))
    }));
  }

  private mod(value: number, length: number): number {
    return ((value % length) + length) % length;
  }

  private updateBodyOverflow(): void {
    const locked = !this.permanentlyUnlocked;
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  private isHeroDominantOnScreen(): boolean {
    const threshold = window.innerHeight * 0.8;
    return window.scrollY < threshold;
  }
}
