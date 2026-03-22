import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared Quantity Selector Component
 * 
 * Reusable quantity control with consistent styling and behavior across the application.
 * Uses Ponsai icons (plus.png, minus.png) for visual consistency.
 * 
 * @example
 * ```html
 * <app-quantity-selector
 *   [value]="quantity"
 *   [min]="1"
 *   [max]="99"
 *   (valueChange)="onQuantityChange($event)"
 *   [disabled]="!inStock"
 * ></app-quantity-selector>
 * ```
 */
@Component({
  selector: 'app-quantity-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quantity-controls" [class.disabled]="disabled">
      <button 
        class="qty-btn qty-minus" 
        type="button"
        [disabled]="disabled || currentValue() <= min"
        (click)="decrease()"
        [attr.aria-label]="'Decrease quantity'"
        [title]="'Decrease quantity'"
      >
        <img src="assets/icons/minus.png" alt="-" class="qty-icon">
      </button>
      
      <input 
        type="number" 
        class="qty-input" 
        [value]="currentValue()"
        [min]="min"
        [max]="max"
        [disabled]="disabled"
        (input)="onInputChange($event)"
        (blur)="validateInput()"
        [attr.aria-label]="'Quantity'"
      >
      
      <button 
        class="qty-btn qty-plus" 
        type="button"
        [disabled]="disabled || currentValue() >= max"
        (click)="increase()"
        [attr.aria-label]="'Increase quantity'"
        [title]="'Increase quantity'"
      >
        <img src="assets/icons/plus.png" alt="+" class="qty-icon">
      </button>
    </div>
  `,
  styles: [`
    /* Quantity Controls Container */
    .quantity-controls {
      display: inline-flex;
      align-items: stretch;
      justify-content: center;
      gap: 0;
      width: fit-content;
      border: none;
      border-radius: 18px;
      overflow: hidden;
      height: 48px;
      background: #e0e5ec;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      box-shadow:
        -6px -6px 12px rgba(255, 255, 255, 0.56),
        6px 6px 12px rgba(163, 177, 198, 0.58);
      box-sizing: border-box;
      vertical-align: middle;
    }

    .quantity-controls:focus-within {
      box-shadow:
        -6px -6px 12px rgba(255, 255, 255, 0.56),
        6px 6px 12px rgba(163, 177, 198, 0.58),
        0 0 0 3px rgba(108, 99, 255, 0.14);
    }

    .quantity-controls.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Quantity Buttons */
    .qty-btn {
      width: 48px;
      height: 48px;
      border: none;
      background: #e0e5ec;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      flex-shrink: 0;
      box-sizing: border-box;
      line-height: 1;
      position: relative;
    }

    .qty-icon {
      width: 16px;
      height: 16px;
      object-fit: contain;
      opacity: 0.78;
      transition: all 0.2s ease;
      pointer-events: none;
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .qty-btn:hover:not(:disabled) {
      background: linear-gradient(145deg, #e5eaf1, #d7dce4);
      box-shadow:
        inset -4px -4px 10px rgba(255, 255, 255, 0.46),
        inset 4px 4px 10px rgba(163, 177, 198, 0.26);
    }

    .qty-btn:hover:not(:disabled) .qty-icon {
      filter: brightness(0) saturate(100%) invert(39%) sepia(68%) saturate(1888%) hue-rotate(226deg) brightness(104%) contrast(102%);
      opacity: 1;
    }

    .qty-btn:active:not(:disabled) {
      background: linear-gradient(145deg, #d8dde5, #e5eaf1);
      box-shadow:
        inset -6px -6px 12px rgba(255, 255, 255, 0.52),
        inset 6px 6px 12px rgba(163, 177, 198, 0.3);
    }

    .qty-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Quantity Input */
    .qty-input {
      width: 68px;
      height: 48px;
      border: none;
      text-align: center;
      font-weight: 700;
      color: #3d4852;
      font-size: 1rem;
      line-height: 48px;
      background: linear-gradient(145deg, #d9dee5, #e7ecf3);
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      -moz-appearance: textfield;
      flex-shrink: 0;
      vertical-align: middle;
      box-shadow:
        inset -4px -4px 10px rgba(255, 255, 255, 0.46),
        inset 4px 4px 10px rgba(163, 177, 198, 0.24);
    }

    .qty-input::-webkit-outer-spin-button,
    .qty-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .qty-input:focus {
      outline: none;
      color: #6c63ff;
    }

    .qty-input:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Responsive */
    @media (max-width: 576px) {
      .quantity-controls {
        height: 42px;
      }

      .qty-btn {
        width: 42px;
        height: 42px;
      }

      .qty-input {
        width: 58px;
        height: 42px;
        line-height: 42px;
        font-size: 0.9rem;
      }

      .qty-icon {
        width: 14px;
        height: 14px;
      }
    }
  `]
})
export class QuantitySelectorComponent implements OnInit, OnChanges {
  @Input() value: number = 1;
  @Input() min: number = 1;
  @Input() max: number = 99;
  @Input() disabled: boolean = false;
  
  @Output() valueChange = new EventEmitter<number>();

  currentValue = signal<number>(1);

  ngOnInit(): void {
    this.currentValue.set(this.clamp(this.value));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['min'] || changes['max']) {
      const clampedValue = this.clamp(this.value);
      if (this.currentValue() !== clampedValue) {
        this.currentValue.set(clampedValue);
      }
    }
  }

  increase(): void {
    if (this.currentValue() < this.max && !this.disabled) {
      const newValue = this.currentValue() + 1;
      this.updateValue(newValue);
    }
  }

  decrease(): void {
    if (this.currentValue() > this.min && !this.disabled) {
      const newValue = this.currentValue() - 1;
      this.updateValue(newValue);
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    
    if (!isNaN(value)) {
      this.currentValue.set(value);
    }
  }

  validateInput(): void {
    const clamped = this.clamp(this.currentValue());
    if (clamped !== this.currentValue()) {
      this.updateValue(clamped);
    }
  }

  private updateValue(value: number): void {
    const clamped = this.clamp(value);
    this.currentValue.set(clamped);
    this.valueChange.emit(clamped);
  }

  private clamp(value: number): number {
    return Math.max(this.min, Math.min(this.max, value));
  }
}
