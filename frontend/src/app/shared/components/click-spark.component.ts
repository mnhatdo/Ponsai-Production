import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild } from '@angular/core';

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

@Component({
  selector: 'app-click-spark',
  standalone: true,
  template: `
    <canvas #sparkCanvas class="click-spark-canvas" aria-hidden="true"></canvas>
  `,
  styles: [`
    .click-spark-canvas {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2500;
    }
  `]
})
export class ClickSparkComponent implements AfterViewInit, OnDestroy {
  @Input() sparkColor: string = 'var(--yale-blue-rgb)';
  @Input() sparkSize: number = 12;
  @Input() sparkRadius: number = 15;
  @Input() sparkCount: number = 8;
  @Input() duration: number = 400;
  @Input() easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' = 'ease-out';
  @Input() extraScale: number = 1.0;

  @ViewChild('sparkCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private sparks: Spark[] = [];
  private animationId: number | null = null;

  ngAfterViewInit(): void {
    this.resizeCanvas();
    this.startDrawLoop();
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();

    for (let index = 0; index < this.sparkCount; index += 1) {
      this.sparks.push({
        x,
        y,
        angle: (2 * Math.PI * index) / this.sparkCount,
        startTime: now
      });
    }
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = Math.ceil(window.innerWidth);
    const height = Math.ceil(window.innerHeight);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  private ease(progress: number): number {
    switch (this.easing) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-in-out':
        return progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      case 'ease-out':
      default:
        return progress * (2 - progress);
    }
  }

  private startDrawLoop(): void {
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const draw = (timestamp: number): void => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      this.sparks = this.sparks.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= this.duration) {
          return false;
        }

        const progress = elapsed / this.duration;
        const eased = this.ease(progress);

        const distance = eased * this.sparkRadius * this.extraScale;
        const lineLength = this.sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        context.strokeStyle = this.sparkColor;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();

        return true;
      });

      this.animationId = requestAnimationFrame(draw);
    };

    this.animationId = requestAnimationFrame(draw);
  }
}
