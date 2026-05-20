import { Component, Inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-accessibility-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accessibility-widget.component.html'
})
export class AccessibilityWidgetComponent {
  isOpen = false;
  activeColorBlindness: string | null = null;
  isLargeText = false;
  isHighContrast = false;

  private allFilters = ['acc-protanopia', 'acc-deuteranopia', 'acc-tritanopia', 'acc-achromatopsia'];

  constructor(@Inject(DOCUMENT) private document: Document, private renderer: Renderer2) {}

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  setColorBlindness(filterClass: string) {
    const htmlElement = this.document.documentElement;
    
    // Quitar filtros anteriores
    this.allFilters.forEach(f => this.renderer.removeClass(htmlElement, f));
    
    if (this.activeColorBlindness === filterClass) {
      this.activeColorBlindness = null; // Si hace click en el mismo, se apaga
    } else {
      this.activeColorBlindness = filterClass;
      this.renderer.addClass(htmlElement, filterClass); // Añadir el nuevo
    }
  }

  toggleTextSize() {
    this.isLargeText = !this.isLargeText;
    const htmlElement = this.document.documentElement;
    if (this.isLargeText) {
      this.renderer.addClass(htmlElement, 'acc-large-text');
    } else {
      this.renderer.removeClass(htmlElement, 'acc-large-text');
    }
  }

  toggleHighContrast() {
    this.isHighContrast = !this.isHighContrast;
    const bodyElement = this.document.body;
    if (this.isHighContrast) {
      this.renderer.addClass(bodyElement, 'acc-high-contrast');
    } else {
      this.renderer.removeClass(bodyElement, 'acc-high-contrast');
    }
  }

  resetAccessibility() {
    const htmlElement = this.document.documentElement;
    const bodyElement = this.document.body;
    
    this.allFilters.forEach(f => this.renderer.removeClass(htmlElement, f));
    this.renderer.removeClass(htmlElement, 'acc-large-text');
    this.renderer.removeClass(bodyElement, 'acc-high-contrast');

    this.activeColorBlindness = null;
    this.isLargeText = false;
    this.isHighContrast = false;
  }
}
