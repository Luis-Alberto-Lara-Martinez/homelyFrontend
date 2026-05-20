import { Injectable, Inject, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private renderer: Renderer2;
  private isBrowser: boolean;

  private _isLargeText = false;
  private _isHighContrast = false;
  private _activeColorBlindness: string | null = null;
  private allFilters = ['acc-protanopia', 'acc-deuteranopia', 'acc-tritanopia', 'acc-achromatopsia'];

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadState();
  }

  get isLargeText(): boolean { return this._isLargeText; }
  get isHighContrast(): boolean { return this._isHighContrast; }
  get activeColorBlindness(): string | null { return this._activeColorBlindness; }
  get filters(): string[] { return this.allFilters; }

  private loadState() {
    if (!this.isBrowser) return;

    const savedState = localStorage.getItem('homely-accessibility');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.isLargeText) this.toggleTextSize(state.isLargeText);
        if (state.isHighContrast) this.toggleHighContrast(state.isHighContrast);
        if (state.activeColorBlindness) this.setColorBlindness(state.activeColorBlindness);
      } catch (e) {
        console.error('Error parsing accessibility state', e);
      }
    }
  }

  private saveState() {
    if (!this.isBrowser) return;
    const state = {
      isLargeText: this._isLargeText,
      isHighContrast: this._isHighContrast,
      activeColorBlindness: this._activeColorBlindness
    };
    localStorage.setItem('homely-accessibility', JSON.stringify(state));
  }

  setColorBlindness(filterClass: string | null) {
    const htmlElement = this.document.documentElement;
    this.allFilters.forEach(f => this.renderer.removeClass(htmlElement, f));
    
    if (filterClass) {
      this.renderer.addClass(htmlElement, filterClass);
      this._activeColorBlindness = filterClass;
    } else {
      this._activeColorBlindness = null;
    }
    this.saveState();
  }

  toggleTextSize(forceState?: boolean) {
    this._isLargeText = forceState !== undefined ? forceState : !this._isLargeText;
    const htmlElement = this.document.documentElement;
    if (this._isLargeText) {
      this.renderer.addClass(htmlElement, 'acc-large-text');
    } else {
      this.renderer.removeClass(htmlElement, 'acc-large-text');
    }
    this.saveState();
  }

  toggleHighContrast(forceState?: boolean) {
    this._isHighContrast = forceState !== undefined ? forceState : !this._isHighContrast;
    const bodyElement = this.document.body;
    if (this._isHighContrast) {
      this.renderer.addClass(bodyElement, 'acc-high-contrast');
    } else {
      this.renderer.removeClass(bodyElement, 'acc-high-contrast');
    }
    this.saveState();
  }

  resetAccessibility() {
    this.setColorBlindness(null);
    this.toggleTextSize(false);
    this.toggleHighContrast(false);
  }
}
